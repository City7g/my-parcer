import * as cheerio from 'cheerio'
import { BaseParser } from './BaseParser.js'

export class JwParser extends BaseParser {
  constructor(config = {}) {
    super(config)
  }

  async extractData(html) {
    const $ = cheerio.load(html)
    const title = $('#content .billboardTitle').first().text().trim()

    if (!title) {
      throw new Error('Заголовок не найден')
    }

    return { title }
  }

  async processData(data) {
    return {
      title: data.title,
      timestamp: new Date().toISOString(),
    }
  }
}
