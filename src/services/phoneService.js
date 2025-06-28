import { getPhone, getIphones } from '../parsers/appleParser.js'
import { handlePhoneError } from '../utils/errorHandler.js'
import { links } from '../config/constants.js'

export class PhoneService {
  constructor(bot) {
    this.bot = bot
  }

  async fetchPhoneData(brand, version, model, msg) {
    const chatId = msg.chat.id

    try {
      const phoneData = await getPhone(brand.toLowerCase(), version, model, msg)

      if (!phoneData) {
        return {
          success: false,
          message: `Извините, информация о модели ${brand} ${version} ${model} не найдена.`,
        }
      }

      return {
        success: true,
        data: phoneData,
      }
    } catch (error) {
      const errorMessage = handlePhoneError(error, brand, version, model)
      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  async fetchCatalog(chatId) {
    try {
      const catalog = await getIphones()

      if (!catalog || catalog.length === 0) {
        return {
          success: false,
          message: '😔 К сожалению, не удалось загрузить каталог. Попробуйте позже.',
        }
      }

      return {
        success: true,
        data: catalog,
      }
    } catch (error) {
      const { userMessage } = handlePhoneError(error, 'Каталог', '', '')
      return {
        success: false,
        message: userMessage,
      }
    }
  }

  getModels(brand, version) {
    return Object.keys(links[brand.toLowerCase()][version])
  }
}
