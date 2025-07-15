import axios from 'axios'
import { EventEmitter } from 'events'
import { http } from '../config/constants.js'

export class BaseParser extends EventEmitter {
  constructor(config = {}) {
    super()
    this.config = {
      timeout: http.TIMEOUT,
      headers: {
        'User-Agent': http.USER_AGENT,
      },
      ...config,
    }
  }

  // Template method
  async parse(url) {
    try {
      this.emit('parseStart', { url })

      const html = await this.fetchPage(url)
      const data = await this.extractData(html)
      const processedData = await this.processData(data)

      this.emit('parseSuccess', { url, data: processedData })
      return processedData
    } catch (error) {
      this.emit('parseError', { url, error: error.message })
      throw error
    }
  }

  // Abstract methods that should be implemented by concrete parsers
  async extractData(html) {
    throw new Error('extractData method must be implemented')
  }

  async processData(data) {
    throw new Error('processData method must be implemented')
  }

  // Common method that can be overridden if needed
  async fetchPage(url) {
    const response = await axios.get(url, this.config)
    return response.data
  }
}
