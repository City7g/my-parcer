export const startKeyboard = {
  keyboard: [[{ text: Math.random(), callback_data: '/jw' }]],
  resize_keyboard: true,
}

export const mainKeyboard = {
  keyboard: [[{ text: 'Test' }]],
  resize_keyboard: true,
}

export const jwKeyboard = {
  // resize_keyboard: true,
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Открыть сайт', url: 'https://example.com' }],
      [{ text: 'Нажми меня', callback_data: 'btn_pressed' }],
    ],
  },
}
