import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
import { setupPhoneHandlers } from './src/handlers/phoneHandlers.js'
import { setupJwHandlers } from './src/handlers/jwHandlers.js'

dotenv.config()

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN не найден в .env файле')
  process.exit(1)
}

const options = {
  polling: true,
}

const bot = new TelegramBot(token, options)

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['🍎 Каталог iPhone', '📱 Телефоны'],
      ['💰 Ценовые диапазоны', '🔄 Обновить данные'],
      ['🔋 Температура устройства', '📰 Статья JW.org'],
      ['ℹ️ Помощь'],
    ],
    resize_keyboard: true,
  },
}

bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id
  const firstName = msg.from.first_name || 'пользователь'

  const welcomeMessage = `Привет, ${firstName}! 👋\n\nЯ бот для получения цен на телефоны из каталога.\n\nВыберите нужный пункт меню:`

  bot.sendMessage(chatId, welcomeMessage, mainMenu)
})

bot.onText(/↩️ Назад в главное меню/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Главное меню:', mainMenu)
})

bot.onText(/💰 Ценовые диапазоны/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Раздел ценовых диапазонов находится в разработке.', mainMenu)
})

bot.onText(/🔄 Обновить данные/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Обновление данных...\n\nДанные успешно обновлены!', mainMenu)
})

bot.onText(/ℹ️ Помощь/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(
    chatId,
    'Справка по использованию бота:\n\n' +
      '🍎 *Каталог iPhone* - получить все модели iPhone с ценами\n' +
      '📱 *Телефоны* - выбрать конкретный тип и модель телефона\n' +
      '💰 *Ценовые диапазоны* - найти телефоны в определенном ценовом диапазоне\n' +
      '🔄 *Обновить данные* - обновить информацию о ценах\n' +
      'ℹ️ *Помощь* - показать эту справку',
    { parse_mode: 'Markdown' }
  )
})

// Обработка неизвестных команд
bot.on('message', msg => {
  const chatId = msg.chat.id
  const text = msg.text

  if (
    text === '/start' ||
    text === '/prices' ||
    text.match(
      /📱 Телефоны|iPhone|Android|↩️ Назад|🍎 Каталог iPhone|💰 Ценовые диапазоны|🔄 Обновить данные|ℹ️ Помощь|Samsung|Samsung Galaxy S2[45]/
    )
  ) {
    return
  }

  bot.sendMessage(chatId, 'Пожалуйста, используйте меню для навигации:', mainMenu)
})

bot.on('polling_error', error => {
  console.error('Ошибка опроса Telegram API:', error.message)
})

// Инициализация обработчиков
setupPhoneHandlers(bot, mainMenu)
setupJwHandlers(bot)

console.log('Телеграм бот запущен!')
