const axios = require('axios')
const cheerio = require('cheerio')

async function getJwCurrentArticleTitle() {
  try {
    const response = await axios.get('https://www.jw.org/ru/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    })
    const $ = cheerio.load(response.data)

    let title = $('#content .billboardTitle').first().text().trim()
    if (!title) return

    return title
  } catch (error) {
    console.error('Ошибка при получении заголовка с jw.org:', error.message)
    return 'Ошибка при получении заголовка с jw.org'
  }
}

module.exports = {
  getJwCurrentArticleTitle,
}
