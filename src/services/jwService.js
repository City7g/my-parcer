import { parseJwTitle } from '../parsers/jwParser'

class JWService {
  constructor() {
    this.lastTitle = null
    this.lastCheckTime = 0
    this.CACHE_DURATION = 60 * 60 * 1000
  }

  async getCurrentTitle(notifyCallback = null) {
    try {
      const currentTime = Date.now()

      if (this.lastTitle && currentTime - this.lastCheckTime < this.CACHE_DURATION) {
        return this.lastTitle
      }

      const newTitle = await parseJwTitle()

      if (this.lastTitle && newTitle !== this.lastTitle && notifyCallback) {
        notifyCallback(newTitle)
      }

      this.lastTitle = newTitle
      this.lastCheckTime = currentTime

      return newTitle
    } catch (error) {
      console.error('Ошибка при получении заголовка:', error.message)
      return this.lastTitle || null
    }
  }

  async forceUpdateTitle() {
    try {
      const newTitle = await parseJwTitle()
      this.lastTitle = newTitle
      this.lastCheckTime = Date.now()
      return newTitle
    } catch (error) {
      console.error('Ошибка при принудительном обновлении заголовка:', error.message)
      return null
    }
  }

  clearCache() {
    this.lastTitle = null
    this.lastCheckTime = 0
  }
}

export const jwService = new JWService()
