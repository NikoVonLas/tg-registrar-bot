# Quick Start

[Russian version](./QUICKSTART.ru.md)

## Create Bot (2 min)

1. Open [@BotFather](https://t.me/BotFather), send `/newbot`
2. Save token: `123456789:ABCdef...`

## Run Bot

### Via Bot Platform

```bash
curl -X POST http://localhost:3000/bots \
  -d '{"name":"event-reg","runtime":"swarm","sourceType":"local","source":"./tgbots/prohodka"}'

curl -X POST http://localhost:3000/bots/{id}/start \
  -d '{"env":{"BOT_TOKEN":"YOUR_TOKEN"}}'
```

Admin IDs are automatically injected by Bot Platform.

### Locally

```bash
npm install
cp .env.example .env
# Edit .env: BOT_TOKEN and BOT_ADMIN_IDS (your ID from @userinfobot)
npm run dev
```

## Test

1. Open bot, send `/start`, select city
2. Admin: send `/stats`, `/export`

## QR Code

1. Generate: https://qr-code-generator.com
2. URL: `https://t.me/your_bot?start=event`
3. Print and place at venue

## Troubleshooting

**Bot not responding:** Check token, verify bot running, check logs  
**Admin commands fail:** Verify BOT_ADMIN_IDS contains your ID

See [DEPLOYMENT](./DEPLOYMENT.md) for details.
