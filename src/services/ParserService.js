import { ParserFactory } from '../parsers/ParserFactory.js'
import { links } from '../config/constants.js'

export class ParserService {
  constructor() {
    this.parsers = new Map()
  }

  getParser(type) {
    if (!this.parsers.has(type)) {
      const parser = ParserFactory.createParser(type)

      // Подписываемся на события парсера для логирования
      parser.on('parseStart', ({ url }) => {
        console.log(`🔄 Начало парсинга ${url}`)
      })

      parser.on('parseSuccess', ({ url, data }) => {
        console.log(`✅ Успешно спарсено ${url}`)
      })

      parser.on('parseError', ({ url, error }) => {
        console.error(`❌ Ошибка парсинга ${url}:`, error)
      })

      this.parsers.set(type, parser)
    }

    return this.parsers.get(type)
  }

  async parseJwTitle() {
    const parser = this.getParser('jw')
    return parser.parse('https://www.jw.org/ru/')
  }

  async parsePhone(type, version, model, msg) {
    const parser = this.getParser('jabko')
    const url = this._getPhoneUrl(type, version, model)

    const username = msg.from.username || msg.from.first_name || 'Неизвестный пользователь'
    console.log(`👤 Пользователь @${username} запросил информацию о ${type} ${version} ${model}`)

    const result = await parser.parse(url)
    console.log(`✅ Для @${username}: Загружено ${result.data.length} товаров`)

    return {
      ...result,
      url,
    }
  }

  _getPhoneUrl(type, version, model) {
    if (!links[type]?.[version]?.[model]) {
      throw new Error(`Неверные параметры поиска: ${type} ${version} ${model}`)
    }
    return links[type][version][model]
  }
}
