import { dollarRate } from '../config/constants.js'

export function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formatPriceReport(report, modelName) {
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
