# Deployment Guide

Complete guide for deploying Event Registration Bot.

[🇷🇺 Русская версия](./DEPLOYMENT.md)

## Quick Links

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Bot Platform Deployment](#bot-platform-deployment)
- [Docker Deployment](#docker-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

1. Create Telegram bot via [@BotFather](https://t.me/BotFather)
2. Get Admin User ID via [@userinfobot](https://t.me/userinfobot)
3. Generate QR code: https://qr-code-generator.com

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env with BOT_TOKEN and ADMIN_USER_ID
npm run dev
```

## Bot Platform Deployment

### Create and Start Bot

```bash
# Create
curl -X POST http://localhost:3000/bots \
  -H "Content-Type: application/json" \
  -d '{"name":"event-registration","runtime":"swarm","sourceType":"local","source":"./tgbots/prohodka"}'

# Start (replace {id})
curl -X POST http://localhost:3000/bots/{id}/start \
  -H "Content-Type: application/json" \
  -d '{"env":{"BOT_TOKEN":"...","ADMIN_USER_ID":"..."}}'
```

### Verify

```bash
curl http://localhost:3000/bots/{id}          # Status
curl http://localhost:3000/bots/{id}/logs     # Logs
```

### Update Bot

```bash
curl -X POST http://localhost:3000/bots/{id}/stop
curl -X POST http://localhost:3000/bots/{id}/rebuild
curl -X POST http://localhost:3000/bots/{id}/start -d '{"env":{...}}'
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY tsconfig.json src ./
RUN npm run build
RUN mkdir -p /app/data
CMD ["node", "dist/index.js"]
```

### Build and Run

```bash
docker build -t event-bot .
docker run -d --name event-bot --env-file .env -v $(pwd)/data:/app/data event-bot
```

## Production Checklist

- [ ] Bot token secured
- [ ] Admin ID configured
- [ ] QR codes generated
- [ ] Registration flow tested
- [ ] HTTPS enabled
- [ ] Backup strategy established

## Troubleshooting

### Bot Not Responding

```bash
# Check status
curl http://localhost:3000/bots/{id}

# Check logs
curl http://localhost:3000/bots/{id}/logs | tail -50

# Test webhook
curl -X POST https://domain/w/{id}/webhook -d '{"update_id":1}'
```

### Admin Commands Not Working

Verify `ADMIN_USER_ID` matches your Telegram User ID from @userinfobot.

### Data Not Persisting

Ensure volume is mounted:
```bash
docker inspect event-bot | grep Mounts -A 10
```

## Backup & Recovery

### Backup

```bash
# Via bot
# Send /export command

# Via Docker
docker cp event-bot:/app/data/registrations.json ./backup/
```

### Restore

```bash
docker stop event-bot
docker cp ./backup/registrations.json event-bot:/app/data/
docker start event-bot
```

### Automated Backups

```bash
# Cron (daily at 2 AM)
0 2 * * * root docker exec event-bot cat /app/data/registrations.json > /backup/reg-$(date +\%Y\%m\%d).json
```

## Scaling

- **<10k users**: Current JSON implementation
- **10k-100k**: Migrate to SQLite
- **100k+**: PostgreSQL with horizontal scaling

See [ARCHITECTURE.en.md](./ARCHITECTURE.en.md) for migration details.
