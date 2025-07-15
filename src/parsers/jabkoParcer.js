import * as cheerio from 'cheerio'
import { BaseParser } from './BaseParser.js'
import { dollarRate } from '../config/constants.js'
import { formatPrice, formatPriceReport } from '../utils/formatters.js'

export class JabkoParser extends BaseParser {
  constructor(config = {}) {
    super(config)
  }

  async extractData(html) {
    const $ = cheerio.load(html)
    const items = []

    $('.catalog-product-item').each((i, el) => {
      const title = $(el).find('.catalog-product-item--title').text().trim()
      const price = $(el).find('.catalog-product-item--price .current').text().trim().replace(/\D/g, '')
      const oldPrice = $(el).find('.catalog-product-item--price .old').text().trim().replace(/\D/g, '')

      items.push({
        title,
        price: parseInt(price),
        oldPrice: parseInt(oldPrice) || null,
      })
    })

    // Собираем URL'ы пагинации
    const paginationUrls = new Set()
    $('#content .pagination [data-url]').each((_, el) => {
      const dataUrl = $(el).attr('data-url')
      if (dataUrl) paginationUrls.add(dataUrl)
    })

    return {
      items,
      paginationUrls: Array.from(paginationUrls),
    }
  }

  async processData(data) {
    const memoryGroups = this._groupByMemory(data.items)
    const report = this._generateReport(memoryGroups)
    const modelName = data.items.length > 0 ? data.items[0].title.split(' ').slice(0, 3).join(' ') : 'iPhone'

    return {
      data: report,
      text: formatPriceReport(report, modelName),
    }
  }

  _groupByMemory(items) {
    const memoryGroups = {}

    items.forEach(phone => {
      const memoryMatch = phone.title.match(/(16GB|32GB|64GB|128GB|256GB|512GB|1TB)/)
      if (memoryMatch) {
        const memory = memoryMatch[1]
        if (!memoryGroups[memory]) {
          memoryGroups[memory] = { regular: [], esim: [] }
        }

        const isEsim = phone.title.includes('e-Sim')
        const group = isEsim ? 'esim' : 'regular'
        memoryGroups[memory][group].push(phone)
      }
    })

    return memoryGroups
  }

  _generateReport(memoryGroups) {
    const report = {}

    Object.keys(memoryGroups).forEach(memory => {
      const regular = memoryGroups[memory].regular
      const esim = memoryGroups[memory].esim

      report[memory] = {
        regular: this._calculatePriceStats(regular),
        esim: this._calculatePriceStats(esim),
      }
    })

    return report
  }

  _calculatePriceStats(phones) {
    if (!phones || phones.length === 0) return null

    const prices = phones.map(p => p.price).filter(p => p > 0)
    if (prices.length === 0) return null

    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      count: phones.length,
    }
  }
}
