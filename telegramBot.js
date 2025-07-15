import TelegramBot from 'node-telegram-bot-api'
import { token } from './src/config/constants.js'
import { ParserService } from './src/services/ParserService.js'

const bot = new TelegramBot(token, { polling: true })
const parserService = new ParserService()

bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(
    chatId,
    'Привет! Я бот для отслеживания цен на технику. Используйте команды:\n' +
      '/jw - Получить заголовок с JW.org\n' +
      '/iphone {версия} {модель} - Получить цены на iPhone\n' +
      'Например: /iphone 14 pro'
  )
})

bot.onText(/\/jw/, async msg => {
  const chatId = msg.chat.id
  try {
    const result = await parserService.parseJwTitle()
    bot.sendMessage(chatId, `📖 ${result.title}`)
  } catch (error) {
    bot.sendMessage(chatId, '😔 Извините, произошла ошибка при получении данных.')
    console.error('Ошибка при парсинге JW:', error)
  }
})

bot.onText(/\/iphone (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const [version, model] = match[1].split(' ')

  if (!version || !model) {
    bot.sendMessage(chatId, '❌ Пожалуйста, укажите версию и модель iPhone.\nНапример: /iphone 14 pro')
    return
  }

  try {
    const result = await parserService.parsePhone('iphone', version, model, msg)
    bot.sendMessage(chatId, result.text, { parse_mode: 'Markdown' })
  } catch (error) {
    bot.sendMessage(
      chatId,
      '😔 Извините, произошла ошибка при получении данных. Возможно, указана неверная модель телефона.'
    )
    console.error('Ошибка при парсинге iPhone:', error)
  }
})
