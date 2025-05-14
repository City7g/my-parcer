const express = require('express')
const cors = require('cors')
const axios = require('axios')
const cheerio = require('cheerio')
const { getIphones } = require('./src/parsers/appleParser')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Парсер API работает')
})

app.get('/test', async (req, res) => {
  try {
    const data = await getIphones()

    res.json(data)
  } catch (err) {
    console.log(err)

    res.status(500).json({
      error: 'Ошибка при получении данных',
      message: err.message,
    })
  }
})

app.get('/parse', async (req, res) => {
  try {
    const { url } = req.query

    if (!url) {
      return res.status(400).json({ error: 'URL не указан' })
    }

    const response = await axios.get(url)

    const $ = cheerio.load(response.data)
    const products = $('.catalog-product-item')
      .map((i, el) => {
        return {
          title: $(el).find('.catalog-product-item--title').text().trim(),
          oldPrice: +$(el).find('.catalog-product-item--price .old').text().trim().replace(/\D/g, ''),
          price: +$(el).find('.catalog-product-item--price .current').text().replace(/\D/g, ''),
        }
      })
      .get()

    res.send(products)
  } catch (error) {
    console.error('Ошибка при парсинге:', error.message)
    res.status(500).json({ error: 'Ошибка при парсинге данных' })
  }
})

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
})
