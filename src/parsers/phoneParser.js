const axios = require('axios')
const cheerio = require('cheerio')

// Список популярных украинских интернет-магазинов электроники
const SHOPS = [
  {
    name: 'Rozetka',
    url: 'https://rozetka.com.ua/search/?text=samsung%20galaxy%20s24',
    selector: {
      items: 'div.goods-tile',
      title: '.goods-tile__title',
      price: '.goods-tile__price-value',
    },
  },
  {
    name: 'Citrus',
    url: 'https://www.citrus.ua/search?query=samsung%20galaxy%20s24',
    selector: {
      items: '.product-card',
      title: '.product-card__title',
      price: '.product-card__price',
    },
  },
  {
    name: 'Allo',
    url: 'https://allo.ua/ua/catalogsearch/result/?q=samsung%20galaxy%20s24',
    selector: {
      items: '.products-layout__item',
      title: '.product-card__title',
      price: '.v-pb__cur',
    },
  },
  {
    name: 'Ябло',
    url: 'https://yabko.ua/ua/?s=samsung+galaxy+s24&post_type=product',
    selector: {
      items: '.product-item',
      title: '.product-title',
      price: '.price',
    },
  },
]

async function parseShop(shop) {
  try {
    const response = await axios.get(shop.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    })

    const $ = cheerio.load(response.data)
    const results = []

    $(shop.selector.items).each((i, el) => {
      const title = $(el).find(shop.selector.title).text().trim()

      // Проверяем, что это действительно S24 (исключаем аксессуары, чехлы и т.д.)
      if (
        title.toLowerCase().includes('s24') ||
        title.toLowerCase().includes('galaxy s24') ||
        title.toLowerCase().includes('samsung galaxy s24')
      ) {
        let price = $(el).find(shop.selector.price).text().trim()

        // Очистка цены от лишних символов
        price = price.replace(/[^\d]/g, '')

        if (price) {
          results.push({
            title,
            price: parseInt(price),
            shop: shop.name,
            currency: 'UAH',
          })
        }
      }
    })

    return results
  } catch (error) {
    console.error(`Ошибка при парсинге ${shop.name}:`, error.message)
    return []
  }
}

async function getS24Prices() {
  try {
    const allResults = []

    const promises = SHOPS.map(shop => parseShop(shop))
    const results = await Promise.allSettled(promises)

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value)
      } else {
        console.error(`Не удалось получить данные из ${SHOPS[index].name}: ${result.reason}`)
      }
    })

    // Сортировка результатов по цене (от низкой к высокой)
    return allResults.sort((a, b) => a.price - b.price)
  } catch (error) {
    console.error('Ошибка при получении цен:', error.message)
    return []
  }
}

async function getMinPricesByShop() {
  try {
    const allPrices = await getS24Prices()
    const minPrices = {}

    // Инициализируем объект минимальных цен для каждого магазина
    SHOPS.forEach(shop => {
      minPrices[shop.name] = null
    })

    // Находим минимальную цену для каждого магазина
    allPrices.forEach(item => {
      if (minPrices[item.shop] === null || item.price < minPrices[item.shop]) {
        minPrices[item.shop] = item.price
      }
    })

    return minPrices
  } catch (error) {
    console.error('Ошибка при получении минимальных цен:', error.message)
    return {}
  }
}

async function getFormattedMinPrices() {
  try {
    const minPrices = await getMinPricesByShop()

    return (
      `Rozetka - ${minPrices['Rozetka'] !== null ? minPrices['Rozetka'] + ' грн' : 'нет данных'}, ` +
      `Allo - ${minPrices['Allo'] !== null ? minPrices['Allo'] + ' грн' : 'нет данных'}, ` +
      `Citrus - ${minPrices['Citrus'] !== null ? minPrices['Citrus'] + ' грн' : 'нет данных'}, ` +
      `Ябло - ${minPrices['Ябло'] !== null ? minPrices['Ябло'] + ' грн' : 'нет данных'}`
    )
  } catch (error) {
    console.error('Ошибка при форматировании цен:', error.message)
    return 'Ошибка при получении цен'
  }
}

module.exports = {
  getS24Prices,
  getMinPricesByShop,
  getFormattedMinPrices,
}
