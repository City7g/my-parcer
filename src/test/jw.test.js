import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getJwCurrentArticleTitle } from '../parsers/jwParser'
import jwHomePage from '../mock/jw-home-page.html?raw'
import axios from 'axios'

vi.mock('axios')

describe('JW Parser Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully parse article title', async () => {
    axios.get.mockResolvedValue({
      data: jwHomePage,
    })

    const title = await getJwCurrentArticleTitle()
    expect(title).toBe('Тревожность у мужчин')

    expect(axios.get).toHaveBeenCalledTimes(1)
    expect(axios.get).toHaveBeenCalledWith('https://www.jw.org/ru/', {
      headers: {
        'User-Agent': expect.any(String),
      },
      timeout: 10000,
    })
  })
})
