# Ябло iPhone Парсер

Парсер для получения каталога телефонов Apple (iPhone) с сайта Ябло.

## Возможности

- Парсинг каталога iPhone с сайта Ябло
- Группировка моделей по сериям
- Вычисление ценовых диапазонов
- API-интерфейс (Express)
- Telegram-бот

## Установка

1. Клонируйте репозиторий:

```
git clone <url-репозитория>
cd express-parcer
```

2. Установите зависимости:

```
npm install
```

3. Создайте файл `.env` и укажите свой токен Telegram бота:

```
PORT=3000
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

## Использование

### REST API сервер

Запуск сервера API:

```
npm run dev
```

#### Доступные маршруты:

- `GET /apple-catalog` - получить полный каталог iPhone
- `GET /apple-catalog/grouped` - получить каталог сгруппированный по сериям
- `GET /apple-catalog/price-ranges` - получить ценовые диапазоны для серий iPhone

### Telegram бот

Запуск Telegram бота:

```
npm run bot
```

#### Команды бота:

- `/start` - запустить бота и показать основное меню
- `/catalog` - показать все модели iPhone из каталога
- `/series` - показать iPhone сгруппированные по сериям
- `/prices` - показать ценовые диапазоны
- `/refresh` - обновить данные из каталога
- `/help` - показать справку

## Как получить токен Telegram бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям по созданию нового бота
4. После создания BotFather предоставит вам токен, который нужно добавить в файл `.env`

## Структура проекта

- `index.js` - основной файл API сервера
- `telegramBot.js` - файл с кодом Telegram бота
- `src/parsers/` - директория с парсерами
  - `appleParser.js` - парсер для Apple iPhone
  - `phoneParser.js` - парсер для Samsung Galaxy S24
