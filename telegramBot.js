import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
import handleJw from './src/handlers/jw.js'
import { mainKeyboard, jwKeyboard, startKeyboard } from './src/keyboards/index.js'
import { jwRouter } from './src/router/jw.js'

dotenv.config()

const mainMenuKeyboard = {
  keyboard: [
    ['📚 Категория 1', '🎮 Категория 2'],
    ['📞 Контакты', '❓ Помощь'],
  ],
  resize_keyboard: true,
}

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN не найден в .env файле')
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: true })

// Установка команд для меню слева
const setupCommands = async () => {
  try {
    await bot.setMyCommands([
      { command: 'start', description: 'Начать работу с ботом' },
      { command: 'jw', description: 'Получить текущую статью JW' },
      { command: 'change', description: 'Изменить настройки' },
      { command: 'help', description: 'Получить помощь' },
    ])
    console.log('Команды успешно установлены!')
  } catch (error) {
    console.error('Ошибка при установке команд:', error)
  }
}

// Вызываем установку команд при запуске бота
setupCommands()

bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Start', startKeyboard)
})

bot.onText(/\/change/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Change', { reply_markup: mainMenuKeyboard })
})

bot.onText(/\/help/, msg => {
  const chatId = msg.chat.id
  const helpText = `
🤖 *Доступные команды:*

/start - Начать работу с ботом
/jw - Получить текущую статью JW
/change - Изменить настройки
/help - Показать это сообщение

💡 *Как пользоваться:*
• Выберите команду из меню слева
• Или используйте кнопки на клавиатуре
• Для быстрого доступа введите / в поле ввода
  `
  bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' })
})

await jwRouter(bot)

console.log('Телеграм бот запущен!')
