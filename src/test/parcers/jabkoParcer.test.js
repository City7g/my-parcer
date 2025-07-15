import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getPhone, getUrl, parcePhone } from '../../parsers/jabkoParcer'
import jabkoPhone from '../mock/jabko-phone.html?raw'
import jabkoPhone2 from '../mock/jabko-phone-2.html?raw'
import axios from 'axios'

vi.mock('axios')

describe('Jabko Parser Tests', () => {
  it('Current parce jabko phone', () => {
    expect(parcePhone(jabkoPhone)).toEqual([
      {
        title: 'iPhone 15 Pro 256GB',
        price: '52999',
        oldPrice: '54999',
      },
      {
        oldPrice: '55999',
        price: '53999',
        title: 'iPhone 15 Pro 256GB e-Sim',
      },
      {
        oldPrice: '64999',
        price: '62999',
        title: 'iPhone 15 Pro 512GB',
      },
    ])
  })
})

// describe('Phone Parser Tests', () => {
//   const mockMsg = {
//     from: {
//       username: 'testUser',
//       first_name: 'Test User',
//     },
//   }

//   beforeEach(() => {
//     vi.clearAllMocks()
//   })

//   it('should successfully parse phone data from single page', async () => {
//     axios.get.mockResolvedValueOnce({
//       data: jabkoPhone,
//     })

//     const result = await getPhone('iphone', '15', 'pro', mockMsg)

//     expect(result).toEqual({
//       data: {
//         '256GB': {
//           regular: {
//             minPrice: 52999,
//             maxPrice: 52999,
//             count: 1,
//           },
//           esim: {
//             minPrice: 53999,
//             maxPrice: 53999,
//             count: 1,
//           },
//         },
//         '512GB': {
//           regular: {
//             minPrice: 62999,
//             maxPrice: 62999,
//             count: 1,
//           },
//           esim: null,
//         },
//       },
//       text: expect.stringContaining('iPhone 15 Pro - ЦЕНЫ'),
//     })

//     expect(axios.get).toHaveBeenCalledTimes(1)
//   })

//   it('should handle pagination and merge results', async () => {
//     // Первый запрос возвращает первую страницу с пагинацией
//     axios.get.mockResolvedValueOnce({
//       data: jabkoPhone,
//     })

//     // Второй запрос возвращает вторую страницу
//     axios.get.mockResolvedValueOnce({
//       data: jabkoPhone2,
//     })

//     const result = await getPhone('iphone', '15', 'pro', mockMsg)

//     expect(result.data).toEqual({
//       '256GB': {
//         regular: {
//           minPrice: 52999,
//           maxPrice: 52999,
//           count: 1,
//         },
//         esim: {
//           minPrice: 53999,
//           maxPrice: 53999,
//           count: 1,
//         },
//       },
//       '512GB': {
//         regular: {
//           minPrice: 62999,
//           maxPrice: 62999,
//           count: 1,
//         },
//         esim: null,
//       },
//       '1TB': {
//         regular: {
//           minPrice: 72999,
//           maxPrice: 72999,
//           count: 1,
//         },
//         esim: {
//           minPrice: 73999,
//           maxPrice: 73999,
//           count: 1,
//         },
//       },
//     })

//     expect(axios.get).toHaveBeenCalledTimes(2)
//   })

//   it('should handle network errors gracefully', async () => {
//     axios.get.mockRejectedValue(new Error('Network error'))

//     const result = await getPhone('iphone', '15', 'pro', mockMsg)

//     expect(result).toEqual({
//       data: {},
//       text: expect.stringContaining('iPhone'),
//     })

//     expect(axios.get).toHaveBeenCalledTimes(1)
//   })

//   it('should handle empty response', async () => {
//     axios.get.mockResolvedValue({
//       data: '<html><body></body></html>',
//     })

//     const result = await getPhone('iphone', '15', 'pro', mockMsg)

//     expect(result).toEqual({
//       data: {},
//       text: expect.stringContaining('iPhone'),
//     })

//     expect(axios.get).toHaveBeenCalledTimes(1)
//   })

//   it('should format prices correctly in the output text', async () => {
//     axios.get.mockResolvedValueOnce({
//       data: jabkoPhone,
//     })

//     const result = await getPhone('iphone', '15', 'pro', mockMsg)

//     expect(result.text).toMatch(/52 999 грн/)
//     expect(result.text).toMatch(/62 999 грн/)
//     expect(result.text).toMatch(/\$\d+/) // Проверяем наличие цены в долларах
//   })
// })
