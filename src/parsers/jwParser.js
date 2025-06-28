import axios from 'axios'
import * as cheerio from 'cheerio'

let lastTitle = null
let lastCheckTime = 0
const CACHE_DURATION = 60 * 60 * 1000

export async function getJwCurrentArticleTitle(notifyCallback = null) {
  try {
    const currentTime = Date.now()

    if (lastTitle && currentTime - lastCheckTime < CACHE_DURATION) {
      return lastTitle
    }

    const response = await axios.get('https://www.jw.org/ru/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    })

    const $ = cheerio.load(response.data)
    const newTitle = $('#content .billboardTitle').first().text().trim()

    if (!newTitle) {
      return lastTitle || null
    }

    if (lastTitle && newTitle !== lastTitle && notifyCallback) {
      notifyCallback(newTitle)
    }

    lastTitle = newTitle
    lastCheckTime = currentTime

    return newTitle
  } catch (error) {
    console.error('Ошибка при получении заголовка с jw.org:', error.message)
    return lastTitle || 'Ошибка при получении заголовка с jw.org'
  }
}
