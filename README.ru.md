# Event Registration Bot

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./docs/CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

Telegram бот для регистрации посетителей мероприятий через QR-код с учётом городов.

[English version](./README.md)

## Возможности

- Регистрация через QR-код
- Выбор города: топ-15, поиск по 160+ городам России, геолокация (заготовка)
- Админ команды: `/stats`, `/export` (CSV)
- JSON хранилище (до 10k регистраций)
- Совместимость с Bot Platform

## Быстрый старт

### Подготовка

1. Создайте бота через [@BotFather](https://t.me/BotFather), сохраните токен
2. Получите User ID через [@userinfobot](https://t.me/userinfobot)

### Локальная разработка

```bash
npm install
cp .env.example .env
# Отредактируйте .env: BOT_TOKEN и ADMIN_USER_ID
npm run dev
```

### Развёртывание через Bot Platform

```bash
# Создать бота
curl -X POST http://localhost:3000/bots \
  -H "Content-Type: application/json" \
  -d '{"name":"event-reg","runtime":"swarm","sourceType":"local","source":"./tgbots/prohodka"}'

# Запустить (замените {id})
curl -X POST http://localhost:3000/bots/{id}/start \
  -H "Content-Type: application/json" \
  -d '{"env":{"BOT_TOKEN":"ВАШ_ТОКЕН","ADMIN_USER_ID":"ВАШ_ID"}}'
```

## Команды

**Пользователи:**
- `/start` - Регистрация
- `/help` - Справка

**Администратор:**
- `/stats` - Статистика по городам
- `/export` - Экспорт в CSV

## QR-код

1. Создайте QR: `https://t.me/ваш_бот?start=event`
2. Сервис: https://qr-code-generator.com
3. Распечатайте и разместите на входе

## Технологии

- Framework: grammY 1.23.0
- Язык: TypeScript 5.3.3
- Runtime: Node.js 18+
- Хранилище: JSON файлы
- Развёртывание: Docker / Bot Platform

## Производительность

- <500ms время регистрации
- <10k пользователей: JSON (текущее)
- 10k-100k: SQLite
- 100k+: PostgreSQL

Подробнее в [ARCHITECTURE](./docs/ARCHITECTURE.md).

## Документация

- [QUICKSTART](./docs/QUICKSTART.md) - Инструкция за 5 минут
- [DEPLOYMENT](./docs/DEPLOYMENT.md) - Развёртывание
- [API](./docs/API.md) - Справочник команд
- [ARCHITECTURE](./docs/ARCHITECTURE.md) - Архитектура
- [CONTRIBUTING](./docs/CONTRIBUTING.md) - Как внести вклад

## Лицензия

MIT License - см. [LICENSE](./LICENSE)
