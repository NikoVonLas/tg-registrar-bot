# Event Registration Bot

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./docs/CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

Telegram bot for event registration via QR codes with city tracking.

[Russian version](./README.ru.md)

## Features

- QR-code based registration flow
- City selection: top-15 list, text search (160+ Russian cities)
- Multi-language: English (default), Russian (via `LANGUAGE=ru-RU`)
- Admin commands: `/stats`, `/export` (CSV)
- JSON storage (up to 10k registrations)
- Bot Platform compatible

## Quick Start

### Prerequisites

1. Create bot via [@BotFather](https://t.me/BotFather), save token
2. Get your User ID via [@userinfobot](https://t.me/userinfobot)

### Local Development

```bash
npm install
cp .env.example .env
# Edit .env with BOT_TOKEN and ADMIN_USER_ID
npm run dev
```

### Bot Platform Deployment

```bash
# Create bot
curl -X POST http://localhost:3000/bots \
  -H "Content-Type: application/json" \
  -d '{"name":"event-reg","runtime":"swarm","sourceType":"local","source":"./tgbots/prohodka"}'

# Start bot (replace {id})
curl -X POST http://localhost:3000/bots/{id}/start \
  -H "Content-Type: application/json" \
  -d '{"env":{"BOT_TOKEN":"YOUR_TOKEN"}}'
```

**Note:** Bot Platform automatically injects `BOT_ADMIN_IDS` with platform admin IDs.

## Commands

**Users:**
- `/start` - Register
- `/help` - Help

**Admin:**
- `/stats` - Statistics by city
- `/export` - Export CSV

## QR Code Setup

1. Generate QR: `https://t.me/your_bot?start=event`
2. Use: https://qr-code-generator.com
3. Print and place at venue entrance

## Tech Stack

- Framework: grammY 1.23.0
- Language: TypeScript 5.3.3
- Runtime: Node.js 18+
- Storage: JSON files
- Deployment: Docker / Bot Platform

## Performance & Scaling

- <500ms registration time
- <10k users: JSON (current)
- 10k-100k: SQLite
- 100k+: PostgreSQL

See [ARCHITECTURE](./docs/ARCHITECTURE.md) for details.

## Documentation

- [QUICKSTART](./docs/QUICKSTART.md) - 5-minute setup guide
- [DEPLOYMENT](./docs/DEPLOYMENT.md) - Deployment instructions
- [API](./docs/API.md) - Commands reference
- [ARCHITECTURE](./docs/ARCHITECTURE.md) - System design
- [CONTRIBUTING](./docs/CONTRIBUTING.md) - How to contribute

## License

MIT License - see [LICENSE](./LICENSE)
