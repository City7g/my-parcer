import axios from 'axios'
import { parseJwTitle } from '../../parsers/jwParser'
import jwHomePage1 from '../../mock/jw-home-page-1.html?raw'
import errorPage from '../../mock/error-page.html?raw'

jest.mock('axios')

describe('parseJwTitle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('должен успешно извлекать заголовок из HTML', async () => {
    axios.get.mockResolvedValueOnce({ data: jwHomePage1 })

    const title = await parseJwTitle()

    expect(title).toBe('Статья 1')

    expect(axios.get).toHaveBeenCalledWith(
      'https://www.jw.org/ru/',
      expect.objectContaining({
        headers: {
          'User-Agent': expect.any(String),
        },
        timeout: 10000,
      })
    )
  })

  it('должен выбрасывать ошибку, если заголовок не найден', async () => {
    axios.get.mockResolvedValueOnce({ data: errorPage })

    await expect(parseJwTitle()).rejects.toThrow('Заголовок не найден')
  })

  it('должен выбрасывать ошибку при проблемах с сетью', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'))

    await expect(parseJwTitle()).rejects.toThrow('Ошибка сети при загрузке страницы')
  })

  it('должен корректно обрабатывать пустой HTML', async () => {
    axios.get.mockResolvedValueOnce({ data: '' })

    await expect(parseJwTitle()).rejects.toThrow('Заголовок не найден')
  })
})
