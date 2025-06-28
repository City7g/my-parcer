import { links } from '../config/constants.js'

export const mainMenu = {
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

export const phoneTypesMenu = {
  reply_markup: {
    keyboard: [['iPhone', 'Android'], ['↩️ Назад в главное меню']],
    resize_keyboard: true,
  },
}

export const createModelMenu = (brand, versions, backButton = '↩️ Назад к выбору типа') => ({
  reply_markup: {
    keyboard: [...Object.keys(versions).map(version => [`${brand} ${version}`]), [backButton]],
    resize_keyboard: true,
  },
})

export const createVersionMenu = (brand, version, models, backButton = '↩️ Назад к выбору версии') => ({
  reply_markup: {
    keyboard: [
      ...Array.from({ length: Math.ceil(models.length / 2) }, (_, i) =>
        models.slice(i * 2, i * 2 + 2).map(model => `${brand} ${version} ${model}`)
      ),
      [backButton],
    ],
    resize_keyboard: true,
  },
})

export const iphoneModelsMenu = createModelMenu('iPhone', links.iphone)
export const samsungModelsMenu = createModelMenu('Samsung', links.samsung)
export const pixelModelsMenu = createModelMenu('Pixel', links.pixel)
