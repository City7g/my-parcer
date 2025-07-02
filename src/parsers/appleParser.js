import axios from 'axios'
import * as cheerio from 'cheerio'
import { dollarRate, links } from '../config/constants.js'
import { formatPrice, formatPriceReport } from '../utils/formatters.js'

async function getPhone(type, version, model, msg) {
  const url = links[type][version][model]
  const allResults = []

  const username = msg.from.username || msg.from.first_name || 'Неизвестный пользователь'
  console.log(`👤 Пользователь @${username} запросил информацию о ${type} ${version} ${model}`)

  const parsePage = async pageUrl => {
    try {
      const response = await axios.get(pageUrl, {
        timeout: 15000,
      })

      const $ = cheerio.load(response.data)
      const pageResults = []

      $('.catalog-product-item').each((i, el) => {
        const title = $(el).find('.catalog-product-item--title').text().trim()
        const price = $(el).find('.catalog-product-item--price .current').text().trim().replace(/\D/g, '')
        const oldPrice = $(el).find('.catalog-product-item--price .old').text().trim().replace(/\D/g, '')

        pageResults.push({
          title,
          price,
          oldPrice,
        })
      })

      return pageResults
    } catch (error) {
      console.error(`Ошибка при загрузке страницы ${pageUrl}:`, error.message)
      return []
    }
  }

  // Загружаем первую страницу
  const firstPageResponse = await axios.get(url, {
    timeout: 15000,
  })
  const $ = cheerio.load(firstPageResponse.data)

  const paginationUrls = new Set([url])
  $('#content .pagination [data-url]').each((_, el) => {
    const dataUrl = $(el).attr('data-url')
    if (dataUrl) paginationUrls.add(dataUrl)
  })

  const pagePromises = Array.from(paginationUrls).map(pageUrl => parsePage(pageUrl))
  const pagesResults = await Promise.allSettled(pagePromises)

  // Собираем все результаты
  pagesResults.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      allResults.push(...result.value)
    }
  })

  console.log(`✅ Для @${username}: Загружено ${allResults.length} товаров с ${paginationUrls.size} страниц`)
  const analysis = analyzeIphonePrices(allResults)
  return {
    ...analysis,
    url,
  }
}

function analyzeIphonePrices(iphones) {
  const memoryGroups = {}

  iphones.forEach(phone => {
    const memoryMatch = phone.title.match(/(16GB|32GB|64GB|128GB|256GB|512GB|1TB)/)
    if (memoryMatch) {
      const memory = memoryMatch[1]
      if (!memoryGroups[memory]) {
        memoryGroups[memory] = { regular: [], esim: [] }
      }
    }
  })

  iphones.forEach(phone => {
    const memoryMatch = phone.title.match(/(128GB|256GB|512GB|1TB|64GB|32GB|16GB)/)
    if (!memoryMatch) return

    const memory = memoryMatch[1]
    const isEsim = phone.title.includes('e-Sim')
    const group = isEsim ? 'esim' : 'regular'

    memoryGroups[memory][group].push({
      title: phone.title,
      price: parseInt(phone.price),
      oldPrice: parseInt(phone.oldPrice),
    })
  })

  // Формируем итоговый отчет
  const report = {}

  Object.keys(memoryGroups).forEach(memory => {
    const regular = memoryGroups[memory].regular
    const esim = memoryGroups[memory].esim

    report[memory] = {
      regular:
        regular.length > 0
          ? {
              minPrice: Math.min(...regular.map(p => p.price)),
              maxPrice: Math.max(...regular.map(p => p.price)),
              count: regular.length,
            }
          : null,

      esim:
        esim.length > 0
          ? {
              minPrice: Math.min(...esim.map(p => p.price)),
              maxPrice: Math.max(...esim.map(p => p.price)),
              count: esim.length,
            }
          : null,
    }
  })

  const modelName = iphones.length > 0 ? iphones[0].title.split(' ').slice(0, 3).join(' ') : 'iPhone'

  return {
    data: report,
    text: formatPriceReport(report, modelName),
  }
}

async function getIphones() {
  const allResults = []
  const errors = []

  // Функция для парсинга одной страницы
  const parsePage = async pageUrl => {
    try {
      const response = await axios.get(pageUrl, {
        timeout: 15000,
      })

      const $ = cheerio.load(response.data)
      const pageResults = []

      $('.catalog-product-item').each((i, el) => {
        const title = $(el).find('.catalog-product-item--title').text().trim()
        const price = $(el).find('.catalog-product-item--price .current').text().trim().replace(/\D/g, '')
        const oldPrice = $(el).find('.catalog-product-item--price .old').text().trim().replace(/\D/g, '')

        pageResults.push({
          title,
          price,
          oldPrice,
        })
      })

      return pageResults
    } catch (error) {
      errors.push(`Ошибка при загрузке страницы ${pageUrl}: ${error.message}`)
      return []
    }
  }

  // Загружаем данные для всех моделей iPhone
  for (const version in links.iphone) {
    for (const model in links.iphone[version]) {
      const url = links.iphone[version][model]
      try {
        // Загружаем первую страницу для получения пагинации
        const firstPageResponse = await axios.get(url, {
          timeout: 15000,
        })
        const $ = cheerio.load(firstPageResponse.data)

        // Собираем все URL'ы из пагинации
        const paginationUrls = new Set([url])
        $('#content .pagination [data-url]').each((_, el) => {
          const dataUrl = $(el).attr('data-url')
          if (dataUrl) paginationUrls.add(dataUrl)
        })

        // Загружаем данные со всех страниц параллельно
        const pagePromises = Array.from(paginationUrls).map(pageUrl => parsePage(pageUrl))
        const pagesResults = await Promise.allSettled(pagePromises)

        // Собираем все результаты
        pagesResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            allResults.push(...result.value)
          }
        })
      } catch (error) {
        errors.push(`Ошибка при загрузке iPhone ${version} ${model}: ${error.message}`)
      }
    }
  }

  if (allResults.length === 0) {
    console.error('Ошибки при загрузке каталога:', errors)
    return { text: '😔 К сожалению, не удалось загрузить каталог. Попробуйте позже.' }
  }

  // Группируем телефоны по моделям
  const groupedPhones = {}
  allResults.forEach(phone => {
    const modelMatch = phone.title.match(/iPhone (\d+)/)
    if (!modelMatch) return

    const model = modelMatch[1]
    if (!groupedPhones[model]) {
      groupedPhones[model] = []
    }
    groupedPhones[model].push(phone)
  })

  // Формируем текст каталога
  let catalogText = '📱 *Каталог iPhone*\n\n'

  Object.keys(groupedPhones)
    .sort((a, b) => b - a) // Сортируем по убыванию номера модели
    .forEach(model => {
      const phones = groupedPhones[model]
      const prices = phones.map(p => parseInt(p.price)).filter(p => p > 0)
      if (prices.length === 0) return

      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const priceInUsdMin = Math.round(minPrice / dollarRate)
      const priceInUsdMax = Math.round(maxPrice / dollarRate)

      catalogText += `🔸 *iPhone ${model}*\n`
      if (minPrice === maxPrice) {
        catalogText += `   💰 ${formatPrice(minPrice)} грн (${priceInUsdMin}$)\n`
      } else {
        catalogText += `   💰 ${formatPrice(minPrice)} - ${formatPrice(maxPrice)} грн\n`
        catalogText += `   💸 ${priceInUsdMin}$ - ${priceInUsdMax}$\n`
      }
      catalogText += '\n'
    })

  return {
    data: groupedPhones,
    text: catalogText,
  }
}

export { getPhone, getIphones }
