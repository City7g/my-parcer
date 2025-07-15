import { jwService } from '../../services/jwService'
import { parseJwTitle } from '../../parsers/jwParser'

// Мокаем парсер
jest.mock('../../parsers/jwParser')

describe('JWService', () => {
  beforeEach(() => {
    // Очищаем моки и кэш перед каждым тестом
    jest.clearAllMocks()
    jwService.clearCache()
  })

  describe('getCurrentTitle', () => {
    it('должен получать и кэшировать заголовок', async () => {
      parseJwTitle.mockResolvedValueOnce('Тестовый заголовок')

      const title = await jwService.getCurrentTitle()
      expect(title).toBe('Тестовый заголовок')
      expect(parseJwTitle).toHaveBeenCalledTimes(1)

      // Повторный запрос должен вернуть кэшированный результат
      const cachedTitle = await jwService.getCurrentTitle()
      expect(cachedTitle).toBe('Тестовый заголовок')
      expect(parseJwTitle).toHaveBeenCalledTimes(1) // Парсер не должен вызываться повторно
    })

    it('должен вызывать callback при изменении заголовка', async () => {
      const mockCallback = jest.fn()

      // Первый запрос
      parseJwTitle.mockResolvedValueOnce('Заголовок 1')
      await jwService.getCurrentTitle(mockCallback)
      expect(mockCallback).not.toHaveBeenCalled()

      // Принудительно устанавливаем время последней проверки в прошлое
      jwService.lastCheckTime = Date.now() - jwService.CACHE_DURATION - 1000

      // Второй запрос с другим заголовком
      parseJwTitle.mockResolvedValueOnce('Заголовок 2')
      await jwService.getCurrentTitle(mockCallback)
      expect(mockCallback).toHaveBeenCalledWith('Заголовок 2')
    })

    it('должен возвращать последний успешный результат при ошибке', async () => {
      // Первый успешный запрос
      parseJwTitle.mockResolvedValueOnce('Успешный заголовок')
      const title = await jwService.getCurrentTitle()
      expect(title).toBe('Успешный заголовок')

      // Принудительно устанавливаем время последней проверки в прошлое
      jwService.lastCheckTime = Date.now() - jwService.CACHE_DURATION - 1000

      // Запрос с ошибкой
      parseJwTitle.mockRejectedValueOnce(new Error('Ошибка парсинга'))
      const errorTitle = await jwService.getCurrentTitle()
      expect(errorTitle).toBe('Успешный заголовок')
    })
  })

  describe('forceUpdateTitle', () => {
    it('должен принудительно обновлять заголовок', async () => {
      // Устанавливаем начальный заголовок
      parseJwTitle.mockResolvedValueOnce('Заголовок 1')
      await jwService.getCurrentTitle()

      // Принудительное обновление
      parseJwTitle.mockResolvedValueOnce('Заголовок 2')
      const newTitle = await jwService.forceUpdateTitle()
      expect(newTitle).toBe('Заголовок 2')
      expect(parseJwTitle).toHaveBeenCalledTimes(2)
    })

    it('должен возвращать null при ошибке', async () => {
      parseJwTitle.mockRejectedValueOnce(new Error('Ошибка парсинга'))
      const result = await jwService.forceUpdateTitle()
      expect(result).toBeNull()
    })
  })

  describe('clearCache', () => {
    it('должен очищать кэш', async () => {
      // Устанавливаем начальный заголовок
      parseJwTitle.mockResolvedValueOnce('Тестовый заголовок')
      await jwService.getCurrentTitle()

      // Очищаем кэш
      jwService.clearCache()
      expect(jwService.lastTitle).toBeNull()
      expect(jwService.lastCheckTime).toBe(0)

      // Следующий запрос должен получить новый заголовок
      parseJwTitle.mockResolvedValueOnce('Новый заголовок')
      const title = await jwService.getCurrentTitle()
      expect(title).toBe('Новый заголовок')
      expect(parseJwTitle).toHaveBeenCalledTimes(2)
    })
  })
})
