import { getJwCurrentArticleTitle } from '../parsers/jwParser.js'

const jwChats = new Set()
let jwIntervalStarted = false
let lastJwTitle = ''

export const setupJwHandlers = bot => {
  const loadJW = async msg => {
    const chatId = msg.chat.id
    jwChats.add(chatId)
    bot.sendMessage(chatId, 'Теперь вы будете получать заголовок текущей статьи с jw.org/ru каждый час.')

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
      }, 60 * 1 * 1000)
    }

    const title = await getJwCurrentArticleTitle()
    if (title && title !== lastJwTitle) {
      lastJwTitle = title
      bot.sendMessage(chatId, `📰 Заголовок текущей статьи с jw.org/ru:\n${title}`)
    }
  }

  bot.onText(/📰 Статья JW.org/, loadJW)
  bot.onText(/\/jw/, loadJW)
}
