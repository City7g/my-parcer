export const handleError = (error, context = '') => {
  const timestamp = new Date().toISOString()
  const errorMessage = `[${timestamp}] ${context}: ${error.message}\n${error.stack}\n`

  // Логируем ошибку в консоль
  console.error(errorMessage)

  // Здесь можно добавить логирование в файл или отправку в систему мониторинга
  return {
    userMessage: '🚫 Произошла ошибка. Пожалуйста, попробуйте позже.',
    error,
  }
}

export const handlePhoneError = (error, brand, version, model) => {
  const context = `Ошибка при получении данных ${brand} ${version} ${model}`
  const { userMessage } = handleError(error, context)
  return `${userMessage}\nМодель: ${brand} ${version} ${model}`
}
