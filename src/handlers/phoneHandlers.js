import { getPhone, links, getIphones } from '../parsers/appleParser.js'

export const phoneTypesMenu = {
  reply_markup: {
    keyboard: [['iPhone', 'Android'], ['↩️ Назад в главное меню']],
    resize_keyboard: true,
  },
}

export const iphoneModelsMenu = {
  reply_markup: {
    keyboard: [...Object.keys(links['iphone']).map(version => [`iPhone ${version}`]), ['↩️ Назад к выбору типа']],
    resize_keyboard: true,
  },
}

export const samsungModelsMenu = {
  reply_markup: {
    keyboard: [...Object.keys(links['samsung']).map(version => [`Samsung ${version}`]), ['↩️ Назад к выбору типа']],
    resize_keyboard: true,
  },
}

export const setupPhoneHandlers = (bot, mainMenu) => {
  bot.onText(/📱 Телефоны/, msg => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'Выберите тип телефона:', phoneTypesMenu)
  })

  bot.onText(/iPhone$/, msg => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'Выберите модель iPhone:', iphoneModelsMenu)
  })

  bot.onText(/Samsung$/, msg => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'Выберите модель Samsung:', samsungModelsMenu)
  })

  bot.onText(/iPhone (1[2-6])$/, async (msg, match) => {
    const chatId = msg.chat.id
    const version = match[1]

    const models = Object.keys(links['iphone'][version])

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

  bot.onText(/Samsung (2[0-9])/, async (msg, match) => {
    const chatId = msg.chat.id
    const version = match[1]

    const models = Object.keys(links['samsung'][version])

    const modelsKeyboard = {
      reply_markup: {
        keyboard: [
          ...Array.from({ length: Math.ceil(models.length / 2) }, (_, i) =>
            models.slice(i * 2, i * 2 + 2).map(model => `Samsung ${version} ${model}`)
          ),
          ['↩️ Назад к выбору версии'],
        ],
        resize_keyboard: true,
      },
    }

    bot.sendMessage(chatId, `Выберите модификацию Samsung ${version}:`, modelsKeyboard)
  })

  bot.onText(/iPhone (1[2-6]) (.*)/, async (msg, match) => {
    const chatId = msg.chat.id
    const version = match[1]
    const model = match[2]

    bot.sendChatAction(chatId, 'typing')

    try {
      const phoneData = await getPhone('iphone', version, model, msg)

      if (!phoneData) {
        return bot.sendMessage(chatId, `Извините, информация о модели iPhone ${version} ${model} не найдена.`, mainMenu)
      }

      const waitMessage = await bot.sendMessage(
        chatId,
        `Загружаю информацию о iPhone ${version} ${model}... Пожалуйста, подождите.`
      )

      bot.deleteMessage(chatId, waitMessage.message_id)

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

  bot.onText(/Samsung (2[0-9]) (.*)/, async (msg, match) => {
    const chatId = msg.chat.id
    const version = match[1]
    const model = match[2]

    bot.sendChatAction(chatId, 'typing')

    try {
      const phoneData = await getPhone('samsung', version, model, msg)

      if (!phoneData) {
        return bot.sendMessage(
          chatId,
          `Извините, информация о модели Samsung ${version} ${model} не найдена.`,
          mainMenu
        )
      }

      const waitMessage = await bot.sendMessage(
        chatId,
        `Загружаю информацию о Samsung ${version} ${model}... Пожалуйста, подождите.`
      )

      bot.deleteMessage(chatId, waitMessage.message_id)

      bot.sendMessage(chatId, phoneData.text)
    } catch (error) {
      console.error(`Ошибка при получении данных Samsung ${version} ${model}:`, error.message)
      bot.sendMessage(
        chatId,
        `🚫 Произошла ошибка при загрузке данных о Samsung ${version} ${model}. Пожалуйста, попробуйте позже.`,
        mainMenu
      )
    }
  })

  bot.onText(/Android/, msg => {
    const chatId = msg.chat.id

    const samsungModelsMenu = {
      reply_markup: {
        keyboard: [['Samsung'], ['↩️ Назад к выбору типа']],
        resize_keyboard: true,
      },
    }

    bot.sendMessage(chatId, 'Выберите модель Samsung:', samsungModelsMenu)
  })

  bot.onText(/↩️ Назад к выбору версии/, msg => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'Выберите модель iPhone:', iphoneModelsMenu)
  })

  bot.onText(/🍎 Каталог iPhone/, async msg => {
    const chatId = msg.chat.id

    try {
      bot.sendChatAction(chatId, 'typing')

      const waitMessage = await bot.sendMessage(
        chatId,
        'Загружаю каталог телефонов... Это может занять несколько секунд.'
      )

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

  bot.on('callback_query', async query => {
    const chatId = query.message.chat.id
    const data = query.data

    if (data.startsWith('specs_')) {
      const [_, version, model] = data.split('_')

      try {
        const phoneData = links['iphone'][version][model]

        if (!phoneData) {
          return bot.answerCallbackQuery(query.id, 'Информация о модели не найдена')
        }

        let specsText = `📋 *Технические характеристики iPhone ${version} ${model}*\n\n`

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

        specs.forEach(spec => {
          if (spec.value) {
            specsText += `${spec.icon} *${spec.name}:* ${spec.value}\n`
          }
        })

        bot.answerCallbackQuery(query.id)

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
}
