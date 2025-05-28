import axios from 'axios'
import * as cheerio from 'cheerio'

const dollarRate = 41.51

const links = {
  iphone: {
    15: {
      base: 'https://jabko.ua/iphone/apple-iphone-15-/',
      plus: 'https://jabko.ua/iphone/apple-iphone-15-plus/',
      pro: 'https://jabko.ua/iphone/apple-iphone-15-pro/',
      proMax: 'https://jabko.ua/iphone/apple-iphone-15-pro-max/',
    },
    16: {
      base: 'https://jabko.ua/iphone/apple-iphone-16/',
      plus: 'https://jabko.ua/iphone/apple-iphone-16-plus/',
      pro: 'https://jabko.ua/iphone/apple-iphone-16-pro/',
      proMax: 'https://jabko.ua/iphone/apple-iphone-16-pro-max/',
    },
  },
  samsung: {
    24: {
      base: 'https://jabko.ua/smartfony/smartfony-samsung/samsung-galaxy-s24/',
      plus: 'https://jabko.ua/smartfony/smartfony-samsung/smartfony-samsung-galaxy-s24-plus/',
      ultra: 'https://jabko.ua/smartfony/smartfony-samsung/smartfony-samsung-galaxy-s24-ultra/',
    },
    25: {
      base: 'https://jabko.ua/smartfony/smartfony-samsung/samsung-galaxy-s25/',
      plus: 'https://jabko.ua/smartfony/smartfony-samsung/smartfony-samsung-galaxy-s25-plus/',
      ultra: 'https://jabko.ua/smartfony/smartfony-samsung/smartfony-samsung-galaxy-s25-ultra/',
    },
  },
}

async function getPhone(type, version, model, msg) {
  const url = links[type][version][model]
  const allResults = []

  const username = msg.from.username || msg.from.first_name || 'Неизвестный пользователь'
  console.log(`👤 Пользователь @${username} запросил информацию о ${type} ${version} ${model}`)

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
      console.error(`Ошибка при загрузке страницы ${pageUrl}:`, error.message)
      return []
    }
  }

  // Загружаем первую страницу
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

  console.log(`✅ Для @${username}: Загружено ${allResults.length} товаров с ${paginationUrls.size} страниц`)
  return analyzeIphonePrices(allResults)
}

function analyzeIphonePrices(iphones) {
  // Создаем объект для хранения информации по объемам памяти
  const memoryGroups = {}

  // Сначала собираем все уникальные значения памяти
  iphones.forEach(phone => {
    const memoryMatch = phone.title.match(/(16GB|32GB|64GB|128GB|256GB|512GB|1TB)/)
    if (memoryMatch) {
      const memory = memoryMatch[1]
      if (!memoryGroups[memory]) {
        memoryGroups[memory] = { regular: [], esim: [] }
      }
    }
  })

  // Распределяем телефоны по группам
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

  // Определяем название модели из первого телефона в списке
  const modelName = iphones.length > 0 ? iphones[0].title.split(' ').slice(0, 3).join(' ') : 'iPhone'

  return {
    data: report,
    text: formatPriceReport(report, modelName),
  }
}

function formatPriceReport(report, modelName) {
  let text = `🔥 ${modelName} - ЦЕНЫ 🔥\n\n`

  // Определяем порядок вывода памяти
  const memoryOrder = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB']

  // Сортируем ключи отчета согласно заданному порядку
  const sortedMemories = Object.keys(report).sort((a, b) => {
    return memoryOrder.indexOf(a) - memoryOrder.indexOf(b)
  })

  sortedMemories.forEach(memory => {
    text += `🔹 ${memory}: `

    const allPrices = []

    // Собираем все цены из обеих категорий
    if (report[memory].regular) {
      report[memory].regular.minPrice && allPrices.push(report[memory].regular.minPrice)
      report[memory].regular.maxPrice && allPrices.push(report[memory].regular.maxPrice)
    }

    if (report[memory].esim) {
      report[memory].esim.minPrice && allPrices.push(report[memory].esim.minPrice)
      report[memory].esim.maxPrice && allPrices.push(report[memory].esim.maxPrice)
    }

    if (allPrices.length > 0) {
      const minPrice = Math.min(...allPrices)
      const maxPrice = Math.max(...allPrices)

      if (minPrice === maxPrice) {
        const priceInUsd = Math.round(minPrice / dollarRate)
        text += `${formatPrice(minPrice)} грн (💸 ${priceInUsd}$)`
      } else {
        const minPriceInUsd = Math.round(minPrice / dollarRate)
        const maxPriceInUsd = Math.round(maxPrice / dollarRate)
        text += `${formatPrice(minPrice)} - ${formatPrice(maxPrice)} грн (💸 ${minPriceInUsd}$ - ${maxPriceInUsd}$)`
      }
    } else {
      text += `❌ нет данных`
    }

    text += '\n'
  })

  return text
}

function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export { getPhone, links, analyzeIphonePrices }
