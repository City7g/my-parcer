const TelegramBot = require('node-telegram-bot-api')
const { getAppleCatalog, getIphones, iphoneModels } = require('./src/parsers/appleParser')
const { getJwCurrentArticleTitle } = require('./src/parsers/jwParser')
require('dotenv').config()
const osxTemp = require('osx-temperature-sensor')

// Получаем токен из переменных окружения
const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN не найден в .env файле')
  process.exit(1)
}

// Опции для бота
const options = {
  polling: true,
}

// Создаем экземпляр бота
const bot = new TelegramBot(token, options)

// Главное меню
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

// Меню выбора типа телефона
const phoneTypesMenu = {
  reply_markup: {
    keyboard: [['iPhone', 'Android'], ['↩️ Назад в главное меню']],
    resize_keyboard: true,
  },
}

const iphoneModelsMenu = {
  reply_markup: {
    keyboard: [...Object.keys(iphoneModels).map(version => [`iPhone ${version}`]), ['↩️ Назад к выбору типа']],
    resize_keyboard: true,
  },
}

const jwChats = new Set()
let jwIntervalStarted = false
let lastJwTitle = ''

// Команда /start
bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id
  const firstName = msg.from.first_name || 'пользователь'

  // Приветственное сообщение
  const welcomeMessage = `Привет, ${firstName}! 👋\n\nЯ бот для получения цен на телефоны из каталога.\n\nВыберите нужный пункт меню:`

  bot.sendMessage(chatId, welcomeMessage, mainMenu)
})

// Обработка выбора "Телефоны"
bot.onText(/📱 Телефоны/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Выберите тип телефона:', phoneTypesMenu)
})

// Обработка выбора "iPhone"
bot.onText(/iPhone$/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Выберите модель iPhone:', iphoneModelsMenu)
})

// Обработка выбора версии iPhone (12-16)
bot.onText(/iPhone (1[2-6])$/, async (msg, match) => {
  const chatId = msg.chat.id
  const version = match[1]

  // Получаем все модели для выбранной версии
  const models = Object.keys(iphoneModels[version])

  // Создаем клавиатуру с моделями по 2 в ряд
  const modelsKeyboard = {
    reply_markup: {
      keyboard: [
        ...Array.from({ length: Math.ceil(models.length / 2) }, (_, i) =>
          models.slice(i * 2, i * 2 + 2).map(model => `iPhone ${version} ${model}`)
        ),
        ['↩️ Назад к выбору версии'],
      ],
      resize_keyboard: true,
    },
  }

  bot.sendMessage(chatId, `Выберите модификацию iPhone ${version}:`, modelsKeyboard)
})

// Обработка выбора конкретной модели iPhone
bot.onText(/iPhone (1[2-6]) (.*)/, async (msg, match) => {
  const chatId = msg.chat.id
  const version = match[1]
  const model = match[2]

  bot.sendChatAction(chatId, 'typing')

  try {
    // Получаем данные по модели
    const phoneData = await getIphones(version, model)

    if (!phoneData) {
      return bot.sendMessage(chatId, `Извините, информация о модели iPhone ${version} ${model} не найдена.`, mainMenu)
    }

    // Отправляем сообщение об ожидании
    const waitMessage = await bot.sendMessage(
      chatId,
      `Загружаю информацию о iPhone ${version} ${model}... Пожалуйста, подождите.`
    )

    // Удаляем сообщение об ожидании
    bot.deleteMessage(chatId, waitMessage.message_id)

    // Отправляем информацию о модели
    bot.sendMessage(chatId, phoneData.text)
  } catch (error) {
    console.error(`Ошибка при получении данных iPhone ${version} ${model}:`, error.message)
    bot.sendMessage(
      chatId,
      `🚫 Произошла ошибка при загрузке данных о iPhone ${version} ${model}. Пожалуйста, попробуйте позже.`,
      mainMenu
    )
  }
})

// Обработка выбора "Android"
bot.onText(/Android/, msg => {
  const chatId = msg.chat.id

  // Создаем клавиатуру с моделями Samsung
  const samsungModelsMenu = {
    reply_markup: {
      keyboard: [['Samsung'], ['↩️ Назад к выбору типа']],
      resize_keyboard: true,
    },
  }

  bot.sendMessage(chatId, 'Выберите модель Samsung:', samsungModelsMenu)
})

// Обработка возврата в главное меню
bot.onText(/↩️ Назад в главное меню/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Главное меню:', mainMenu)
})

// Обработка возврата к выбору типа
bot.onText(/↩️ Назад к выбору типа/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Выберите тип телефона:', phoneTypesMenu)
})

// Единственная команда - получение цен на телефоны
bot.onText(/\/prices|🍎 Каталог iPhone/, async msg => {
  const chatId = msg.chat.id

  try {
    // Отправляем сообщение "печатает..."
    bot.sendChatAction(chatId, 'typing')

    // Отправляем сообщение об ожидании
    const waitMessage = await bot.sendMessage(
      chatId,
      'Загружаю каталог телефонов... Это может занять несколько секунд.'
    )

    // Получаем данные из парсера
    const catalog = await getIphones()

    if (catalog.length === 0) {
      return bot.sendMessage(chatId, '😔 К сожалению, не удалось загрузить каталог. Попробуйте позже.', mainMenu)
    }

    bot.deleteMessage(chatId, waitMessage.message_id)

    bot.sendMessage(chatId, catalog.text, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Ошибка при получении каталога телефонов:', error.message)
    bot.sendMessage(chatId, '🚫 Произошла ошибка при загрузке каталога. Пожалуйста, попробуйте позже.', mainMenu)
  }
})

// Обработка других кнопок меню
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

bot.onText(/↩️ Назад к выбору версии/, msg => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 'Выберите модель iPhone:', iphoneModelsMenu)
})

bot.onText(/📰 Статья JW.org/, async msg => {
  const chatId = msg.chat.id
  jwChats.add(chatId)
  bot.sendMessage(chatId, 'Теперь вы будете получать заголовок текущей статьи с jw.org/ru каждый час.')

  // Запускаем интервал только один раз
  if (!jwIntervalStarted) {
    jwIntervalStarted = true
    setInterval(async () => {
      const title = await getJwCurrentArticleTitle()
      if (title && title !== lastJwTitle) {
        lastJwTitle = title
        for (const id of jwChats) {
          bot.sendMessage(id, `📰 Заголовок текущей статьи с jw.org/ru:\n${title}`)
        }
      }
    }, 60 * 1 * 1000) // 1 минута (для теста)
  }

  // Отправляем заголовок сразу при первом запуске
  const title = await getJwCurrentArticleTitle()
  if (title && title !== lastJwTitle) {
    lastJwTitle = title
    bot.sendMessage(chatId, `📰 Заголовок текущей статьи с jw.org/ru:\n${title}`)
  }
})

// Обработка кнопки "🔋 Температура устройства"
bot.onText(/🔋 Температура устройства/, msg => {
  const chatId = msg.chat.id

  let temperature = osxTemp.cpuTemperature()
  let color = '🟢'
  if (temperature.max > 70) color = '🟡'
  if (temperature.max > 85) color = '🔴'
  const tempStr = Number(temperature.max).toFixed(2)

  bot.sendMessage(chatId, `🖥️ Температура устройства\n${color} Температура CPU: ${tempStr}°C`)
})

// Команда для получения температуры устройства
// bot.onText(/\/temp/, async msg => {
//   const chatId = msg.chat.id

//   let temperature = osxTemp.cpuTemperature()

//   console.log(temperature)

//   bot.sendChatAction(chatId, 'typing')
// })

// Обработка неизвестных команд
bot.on('message', msg => {
  const chatId = msg.chat.id
  const text = msg.text

  // Игнорируем команды, которые уже обработаны
  if (
    text === '/start' ||
    text === '/prices' ||
    text.match(
      /📱 Телефоны|iPhone|Android|↩️ Назад|🍎 Каталог iPhone|💰 Ценовые диапазоны|🔄 Обновить данные|ℹ️ Помощь|Samsung|Samsung Galaxy S2[45]/
    )
  ) {
    return
  }

  // Для всех остальных сообщений отправляем подсказку
  bot.sendMessage(chatId, 'Пожалуйста, используйте меню для навигации:', mainMenu)
})

// Обработчик ошибок
bot.on('polling_error', error => {
  console.error('Ошибка опроса Telegram API:', error.message)
})

// Обработка callback-запросов для характеристик
bot.on('callback_query', async query => {
  const chatId = query.message.chat.id
  const data = query.data

  // Обработка запроса характеристик
  if (data.startsWith('specs_')) {
    const [_, version, model] = data.split('_')

    try {
      const phoneData = iphoneModels[version][model]

      if (!phoneData) {
        return bot.answerCallbackQuery(query.id, 'Информация о модели не найдена')
      }

      // Формируем сообщение с техническими характеристиками
      let specsText = `📋 *Технические характеристики iPhone ${version} ${model}*\n\n`

      // Добавляем больше детальных характеристик
      const specs = [
        { icon: '📱', name: 'Дисплей', value: phoneData.displayDetails || phoneData.display },
        { icon: '📏', name: 'Размеры', value: phoneData.dimensions },
        { icon: '⚖️', name: 'Вес', value: phoneData.weight },
        { icon: '🧠', name: 'Процессор', value: phoneData.chipDetails || phoneData.chip },
        { icon: '💾', name: 'Оперативная память', value: phoneData.ram },
        { icon: '💽', name: 'Хранилище', value: phoneData.memory },
        { icon: '📷', name: 'Основная камера', value: phoneData.mainCamera || phoneData.camera },
        { icon: '🤳', name: 'Фронтальная камера', value: phoneData.frontCamera },
        { icon: '🔋', name: 'Батарея', value: phoneData.batteryDetails || phoneData.battery },
        { icon: '🔌', name: 'Зарядка', value: phoneData.charging },
        { icon: '💦', name: 'Водозащита', value: phoneData.waterResistance },
        { icon: '🔒', name: 'Безопасность', value: phoneData.security },
        { icon: '📶', name: 'Связь', value: phoneData.connectivity },
      ]

      // Добавляем только те характеристики, которые есть в данных
      specs.forEach(spec => {
        if (spec.value) {
          specsText += `${spec.icon} *${spec.name}:* ${spec.value}\n`
        }
      })

      // Отвечаем на callback-запрос
      bot.answerCallbackQuery(query.id)

      // Отправляем сообщение с характеристиками
      bot.sendMessage(chatId, specsText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Купить', url: phoneData.buyLink || 'https://www.apple.com/ru/iphone/' }],
            [{ text: '📸 Фото', callback_data: `photos_${version}_${model}` }],
          ],
        },
      })
    } catch (error) {
      console.error(`Ошибка при получении характеристик iPhone ${version} ${model}:`, error.message)
      bot.answerCallbackQuery(query.id, 'Произошла ошибка при загрузке характеристик')
    }
  }
})

console.log('Телеграм бот запущен!')
