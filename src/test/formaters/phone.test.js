import { formatPrice, formatPriceReport } from '../../utils/formatters.js'
import { dollarRate } from '../../config/constants.js'

describe('formatPrice', () => {
  test('форматирует цену с пробелами для тысяч', () => {
    expect(formatPrice(1000)).toBe('1 000')
    expect(formatPrice(10000)).toBe('10 000')
    expect(formatPrice(100000)).toBe('100 000')
    expect(formatPrice(1000000)).toBe('1 000 000')
  })

  test('корректно обрабатывает малые числа', () => {
    expect(formatPrice(100)).toBe('100')
    expect(formatPrice(999)).toBe('999')
  })

  test('корректно обрабатывает строковые значения', () => {
    expect(formatPrice('1000')).toBe('1 000')
    expect(formatPrice('1000000')).toBe('1 000 000')
  })
})

describe('formatPriceReport', () => {
  test('форматирует отчет с одинаковыми ценами', () => {
    const report = {
      '128GB': {
        regular: {
          minPrice: 30000,
          maxPrice: 30000,
        },
      },
    }

    const expected = `🔥 iPhone 14 - ЦЕНЫ 🔥\n\n🔹 128GB: 30 000 грн (💸 ${Math.round(30000 / dollarRate)}$)\n`
    expect(formatPriceReport(report, 'iPhone 14')).toBe(expected)
  })

  test('форматирует отчет с разными ценами', () => {
    const report = {
      '256GB': {
        regular: {
          minPrice: 35000,
          maxPrice: 40000,
        },
      },
    }

    const expected = `🔥 iPhone 14 - ЦЕНЫ 🔥\n\n🔹 256GB: 35 000 - 40 000 грн (💸 ${Math.round(
      35000 / dollarRate
    )}$ - ${Math.round(40000 / dollarRate)}$)\n`
    expect(formatPriceReport(report, 'iPhone 14')).toBe(expected)
  })

  test('форматирует отчет с несколькими объемами памяти в правильном порядке', () => {
    const report = {
      '512GB': {
        regular: {
          minPrice: 50000,
          maxPrice: 50000,
        },
      },
      '128GB': {
        regular: {
          minPrice: 30000,
          maxPrice: 30000,
        },
      },
    }

    const expected =
      `🔥 iPhone 14 - ЦЕНЫ 🔥\n\n` +
      `🔹 128GB: 30 000 грн (💸 ${Math.round(30000 / dollarRate)}$)\n` +
      `🔹 512GB: 50 000 грн (💸 ${Math.round(50000 / dollarRate)}$)\n`

    expect(formatPriceReport(report, 'iPhone 14')).toBe(expected)
  })

  test('обрабатывает отсутствующие данные', () => {
    const report = {
      '128GB': {},
    }

    const expected = `🔥 iPhone 14 - ЦЕНЫ 🔥\n\n🔹 128GB: ❌ нет данных\n`
    expect(formatPriceReport(report, 'iPhone 14')).toBe(expected)
  })

  test('обрабатывает данные с esim', () => {
    const report = {
      '256GB': {
        esim: {
          minPrice: 35000,
          maxPrice: 38000,
        },
      },
    }

    const expected = `🔥 iPhone 14 - ЦЕНЫ 🔥\n\n🔹 256GB: 35 000 - 38 000 грн (💸 ${Math.round(
      35000 / dollarRate
    )}$ - ${Math.round(38000 / dollarRate)}$)\n`
    expect(formatPriceReport(report, 'iPhone 14')).toBe(expected)
  })
})
