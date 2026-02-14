# Event Registration Bot

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./CHANGELOG.en.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![grammY](https://img.shields.io/badge/grammY-1.23-blue.svg)](https://grammy.dev)

**Telegram bot for event registration via QR codes with automatic city tracking.**

> 🎯 Perfect for free events where you need to track attendance and geographic distribution without complex registration forms.

[🇷🇺 Русская версия](./README.md)

## 📑 Table of Contents

- [Features](#features)
- [UX Flow](#ux-flow)
- [Quick Start](#quick-start)
- [Bot Commands](#bot-commands)
- [QR Code Setup](#qr-code-setup)
- [Technical Details](#technical-details)
- [Documentation](#documentation)
- [FAQ](#faq)
- [License](#license)

## ✨ Features

- ✅ **Automatic registration** on first bot interaction
- 📍 **Geolocation** - automatic city detection (optional)
- 🏙 **Top-15 cities** selection via inline buttons
- 🔍 **City search** - text search across 160+ Russian cities
- 📊 **Statistics** - registration counts by city
- 📥 **Data export** to CSV for analysis

## 🎨 UX Flow

**Optimized for minimum clicks and maximum accuracy:**

1. User scans QR code → opens bot (`/start` command)
2. Bot offers:
   - 📍 Share location (auto-detect city)
   - 🏙 Choose manually
3. Manual selection:
   - Shows top-15 cities as buttons (2 columns)
   - "🔍 Find another city" button for search
4. Search mode:
   - User types city name (or partial name)
   - Bot shows up to 20 matches
5. After city selection → registration complete ✅

### Why This Approach Works

- **Minimal errors**: Geolocation and buttons eliminate typos
- **Fast selection**: Top-15 cities cover ~70% of users
- **Flexible search**: Can find any city from 160+
- **Simple UX**: Intuitive interface, one click for popular cities

## 🚀 Quick Start

### Prerequisites

1. **Create Telegram bot:**
   - Open [@BotFather](https://t.me/BotFather)
   - Send `/newbot`
   - Save the token (looks like `123456789:ABCdef...`)

2. **Get your User ID:**
   - Open [@userinfobot](https://t.me/userinfobot)
   - Save User ID (for `/stats` and `/export` access)

### Installation & Launch

#### Via bot-platform (recommended)

1. Create bot via platform API:
```bash
curl -X POST http://localhost:3000/bots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "event-registration",
    "runtime": "swarm",
    "sourceType": "local",
    "source": "./tgbots/prohodka"
  }'
```

2. Start the bot:
```bash
curl -X POST http://localhost:3000/bots/{bot_id}/start \
  -H "Content-Type: application/json" \
  -d '{
    "env": {
      "BOT_TOKEN": "your_bot_token_here",
      "ADMIN_USER_ID": "your_telegram_user_id"
    }
  }'
```

#### Local (for development)

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
BOT_TOKEN=your_bot_token_here
ADMIN_USER_ID=your_telegram_user_id
```

3. Run in dev mode:
```bash
npm run dev
```

4. Or build and run:
```bash
npm run build
node dist/index.js
```

## 💬 Bot Commands

### For users:
- `/start` - Begin registration
- `/help` - Show help

### For admin:
- `/stats` - View registration statistics
- `/export` - Export data to CSV

## 📱 QR Code Setup

Create QR code with link to your bot:
```
https://t.me/your_bot_username?start=event
```

**Recommended QR generators:**
- [qr-code-generator.com](https://qr-code-generator.com) - Free, no ads
- [goqr.me](https://goqr.me) - Simple and fast
- [QR Code Generator](https://www.qr-code-generator.org) - With design customization

**Print settings:**
- Size: minimum 5x5 cm (2x2 inches) for print
- Resolution: 300 DPI
- Error correction level: High (30%)
- Format: PNG or SVG

## 🗺️ City Database

The bot includes a list of **160+ Russian cities**, including:
- All cities with 1M+ population
- Regional capitals
- Major cities (population >100k)

Database is located in `src/data/cities.json` and can be easily extended.

## 💾 Data Storage

Registrations are saved to `data/registrations.json` inside the container.

When using bot-platform, data is automatically saved to a persistent volume for durability across restarts.

### Data Format

```json
{
  "userId": 123456789,
  "username": "user",
  "firstName": "Ivan",
  "lastName": "Ivanov",
  "city": "Moscow",
  "registeredAt": "2026-02-14T12:00:00.000Z"
}
```

## 🔧 Extending Functionality

### Adding New Cities

Edit `src/data/cities.json` and add cities in alphabetical order.

### Geocoding Integration

For automatic city detection from coordinates, you can use:
- **Nominatim** (OpenStreetMap) - free
- **Dadata.ru** - free tier with 10k requests/day
- **Google Geocoding API** - paid

Replace the `reverseGeocode` function in `src/index.ts`.

### Analytics & Export

All data can be exported via `/export` command in CSV format for further analysis in Excel/Google Sheets.

## 🛠️ Technical Details

| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | grammY | 1.23.0 |
| **Language** | TypeScript | 5.3.3 |
| **Runtime** | Node.js | 18+ |
| **Storage** | JSON files | - |
| **Deployment** | Docker / Bot Platform | - |

### Scalability

- ✅ Up to 10,000 registrations: current JSON implementation
- 🔄 10,000-100,000: migrate to SQLite (see [ARCHITECTURE.en.md](./ARCHITECTURE.en.md))
- 🚀 100,000+: PostgreSQL with horizontal scaling

### Performance

- New user registration: <500ms
- City search: <300ms (160+ cities)
- Statistics generation: <1s (1000 users)
- CSV export: <2s (1000 users)

## 📚 Documentation

- **[AGENTS.en.md](./AGENTS.en.md)** - Developer guidelines
- **[ARCHITECTURE.en.md](./ARCHITECTURE.en.md)** - System architecture
- **[API.en.md](./API.en.md)** - Commands and callbacks reference
- **[DEPLOYMENT.en.md](./DEPLOYMENT.en.md)** - Deployment instructions
- **[CONTRIBUTING.en.md](./CONTRIBUTING.en.md)** - How to contribute
- **[CHANGELOG.en.md](./CHANGELOG.en.md)** - Version history
- **[QUICKSTART.en.md](./QUICKSTART.en.md)** - 5-minute setup guide

## ❓ FAQ

### Can I use this for paid events?

Yes, but the bot doesn't handle payments. Use it only for registration, and handle payments through other services (Stripe, YooKassa, etc.).

### How many users can the bot handle?

- Concurrent: 100+ registrations/minute (Telegram API limit)
- Total: up to 10,000 registrations without code changes
- For larger events: see "Scalability" section

### Can I use it for multiple events?

Current version: one bot per event. Multi-event support is planned for version 1.2.0 (see [CHANGELOG.en.md](./CHANGELOG.en.md)).

### How to backup data?

1. Via bot: send `/export` - receive CSV
2. Via Docker: `docker cp bot-name:/app/data/registrations.json ./backup/`
3. Automated: set up cron (see [DEPLOYMENT.en.md](./DEPLOYMENT.en.md#backup--recovery))

### Can I add custom cities?

Yes! Edit `src/data/cities.json`, add cities in alphabetical order, and rebuild:
```bash
npm run build
```

### Does it work offline?

No, requires connection to Telegram Bot API. However, you can deploy a [local Bot API server](https://core.telegram.org/bots/api#using-a-local-bot-api-server).

## 🤝 Support & Contributing

- 🐛 **Found a bug?** [Create an issue](./CONTRIBUTING.en.md#bug-reports)
- 💡 **Have an idea?** [Suggest a feature](./CONTRIBUTING.en.md#feature-requests)
- 🔧 **Want to help?** [Contributing guide](./CONTRIBUTING.en.md)

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

**Built with ❤️ for seamless event registration**
