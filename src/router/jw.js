import { getJwCurrentArticleTitle } from '../parcer/jw.js'
import { jwKeyboard, mainKeyboard } from '../keyboards/index.js'

export const jwRouter = async bot => {
  bot.onText(/\/jw/, async msg => {
    const chatId = msg.chat.id

    const title = await getJwCurrentArticleTitle()

    bot.sendMessage(chatId, title, {
      reply_markup: {
        keyboard: [['JW']],
        resize_keyboard: true,
      },
    })
    bot.sendMessage(chatId, title, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть сайт', url: 'https://example.com' }],
          [{ text: 'Нажми меня', callback_data: 'btn_pressed' }],
        ],
      },
    })
  })
}
