# Deployment Guide

[Russian version](./DEPLOYMENT.ru.md)

## Prerequisites

1. Bot token from [@BotFather](https://t.me/BotFather)
2. QR code: https://qr-code-generator.com

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env: BOT_TOKEN, BOT_ADMIN_IDS (your ID from @userinfobot)
npm run dev
```

## Bot Platform

### Deploy

```bash
# Create
curl -X POST http://localhost:3000/bots \
  -d '{"name":"event-reg","runtime":"swarm","sourceType":"local","source":"./tgbots/prohodka"}'

# Start (admin IDs auto-injected)
curl -X POST http://localhost:3000/bots/{id}/start \
  -d '{"env":{"BOT_TOKEN":"..."}}'
```

### Verify

```bash
curl http://localhost:3000/bots/{id}          # Status
curl http://localhost:3000/bots/{id}/logs     # Logs
```

### Update

```bash
curl -X POST http://localhost:3000/bots/{id}/stop
curl -X POST http://localhost:3000/bots/{id}/start -d '{"env":{...}}'
```

## Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY tsconfig.json src ./
RUN npm run build
CMD ["node", "dist/index.js"]
```

```bash
docker build -t event-bot .
docker run -d --env-file .env -v $(pwd)/data:/app/data event-bot
```

## Troubleshooting

### Bot Not Responding

```bash
curl http://localhost:3000/bots/{id}              # Check status
curl http://localhost:3000/bots/{id}/logs         # View logs
curl -X POST https://domain/w/{id}/webhook -d '{}' # Test webhook
```

### Admin Commands Fail

Verify `BOT_ADMIN_IDS` environment variable contains your Telegram User ID.

For local dev: set in `.env` file  
For Bot Platform: automatically injected

### Data Not Persisting

Ensure volume mounted: `docker inspect {container} | grep Mounts`

## Backup

```bash
# Via bot
# Send /export command

# Via Docker
docker cp bot:/app/data/registrations.json ./backup/
```

## Scaling

- <10k users: JSON (current)
- 10k-100k: SQLite
- 100k+: PostgreSQL

See [ARCHITECTURE](./ARCHITECTURE.md) for migration details.
