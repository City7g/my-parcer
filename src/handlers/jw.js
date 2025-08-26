import { getJwCurrentArticleTitle } from '../parcer/jw.js'

const handleJw = async (bot, chatId) => {
  try {
    const title = await getJwCurrentArticleTitle()

    await bot.sendMessage(chatId, title, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'JW.ORG',
              url: 'https://jw.org',
            },
          ],
        ],
      },
    })
  } catch (error) {
    console.error('Ошибка при получении статьи JW:', error)
    await bot.sendMessage(chatId, 'Извините, произошла ошибка при получении статьи.')
  }
}

export default handleJw
