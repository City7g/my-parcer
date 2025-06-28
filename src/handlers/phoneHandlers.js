import { PhoneService } from '../services/phoneService.js'
import { mainMenu, phoneTypesMenu, iphoneModelsMenu, samsungModelsMenu, createVersionMenu } from '../keyboards/index.js'

export const setupPhoneHandlers = bot => {
  const phoneService = new PhoneService(bot)

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

  // Добавляем обработчик для кнопки "Назад к выбору типа"
  bot.onText(/↩️ Назад к выбору типа/, msg => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'Выберите тип телефона:', phoneTypesMenu)
  })

  const handleVersionSelection = async (msg, brand, version) => {
    const chatId = msg.chat.id
    const models = phoneService.getModels(brand, version)
    const menu = createVersionMenu(brand, version, models)
    bot.sendMessage(chatId, `Выберите модификацию ${brand} ${version}:`, menu)
  }

  bot.onText(/iPhone (1[2-6])$/, (msg, match) => handleVersionSelection(msg, 'iPhone', match[1]))
  bot.onText(/Samsung (2[0-9])/, (msg, match) => handleVersionSelection(msg, 'Samsung', match[1]))

  const handleModelSelection = async (msg, brand, version, model) => {
    const chatId = msg.chat.id
    bot.sendChatAction(chatId, 'typing')

    const waitMessage = await bot.sendMessage(
      chatId,
      `Загружаю информацию о ${brand} ${version} ${model}... Пожалуйста, подождите.`
    )

    const result = await phoneService.fetchPhoneData(brand, version, model, msg)
    bot.deleteMessage(chatId, waitMessage.message_id)

    if (!result.success) {
      return bot.sendMessage(chatId, result.message, mainMenu)
    }

    bot.sendMessage(chatId, result.data.text)
  }

  bot.onText(/iPhone (1[2-6]) (.*)/, (msg, match) => handleModelSelection(msg, 'iPhone', match[1], match[2]))
  bot.onText(/Samsung (2[0-9]) (.*)/, (msg, match) => handleModelSelection(msg, 'Samsung', match[1], match[2]))

  bot.onText(/Android/, msg => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, 'Выберите модель Samsung:', samsungModelsMenu)
  })

  bot.onText(/↩️ Назад к выбору версии/, msg => {
    const chatId = msg.chat.id
    // Определяем последний выбранный бренд (можно добавить сохранение состояния в будущем)
    const lastMessage = msg.reply_to_message?.text || ''
    if (lastMessage.includes('Samsung')) {
      bot.sendMessage(chatId, 'Выберите модель Samsung:', samsungModelsMenu)
    } else {
      bot.sendMessage(chatId, 'Выберите модель iPhone:', iphoneModelsMenu)
    }
  })

  bot.onText(/🍎 Каталог iPhone/, async msg => {
    const chatId = msg.chat.id
    bot.sendChatAction(chatId, 'typing')

    const waitMessage = await bot.sendMessage(
      chatId,
      'Загружаю каталог телефонов... Это может занять несколько секунд.'
    )

    const result = await phoneService.fetchCatalog(chatId)
    bot.deleteMessage(chatId, waitMessage.message_id)

    if (!result.success) {
      return bot.sendMessage(chatId, result.message, mainMenu)
    }

    bot.sendMessage(chatId, result.data.text, { parse_mode: 'Markdown' })
  })
}
