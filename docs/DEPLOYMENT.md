# Deployment Guide

Complete guide for deploying Event Registration Bot in various environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Bot Platform Deployment](#bot-platform-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Production Checklist](#production-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Create Telegram Bot

1. Open Telegram and find [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow prompts to set bot name and username
4. **Save the token** (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Your Admin User ID

1. Open [@userinfobot](https://t.me/userinfobot) in Telegram
2. Send any message
3. **Save your User ID** (numeric, e.g., `987654321`)

### 3. Generate QR Code

Create QR code with your bot link:
```
https://t.me/YOUR_BOT_USERNAME?start=event
```

**Free QR generators:**
- https://qr-code-generator.com
- https://www.qr-code-generator.org
- https://goqr.me

**Recommended settings:**
- Size: 300x300px minimum for print
- Error correction: High (30%)
- Format: PNG or SVG

---

## Local Development

Perfect for testing and development.

### Quick Start

```bash
# 1. Clone/navigate to project
cd /path/to/prohodka

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your values
nano .env  # or use any text editor

# 5. Start development server
npm run dev
```

### Environment Variables

Edit `.env`:
```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
ADMIN_USER_ID=987654321
DEBUG=true
```

### Testing Locally

1. Bot will start in polling mode (no webhook needed)
2. Open Telegram and find your bot
3. Send `/start` command
4. Test registration flow:
   - Try manual city selection
   - Try search functionality
   - Verify `/stats` command (as admin)
   - Test `/export` command

### Building for Production

```bash
# Compile TypeScript
npm run build

# Run compiled version
node dist/index.js
```

---

## Bot Platform Deployment

Recommended for production use with automatic scaling and management.

### Prerequisites

- Bot Platform running and accessible
- Docker/Swarm configured
- API endpoint reachable (default: `http://localhost:3000`)

### Step-by-Step Deployment

#### 1. Prepare Source

Ensure project is in bot-platform structure:
```
tgbots/
├── bot-platform/
│   └── packages/
│       └── ... (platform code)
└── prohodka/
    └── ... (this bot)
```

#### 2. Create Bot Instance

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

**Response:**
```json
{
  "id": "abc123",
  "name": "event-registration",
  "status": "created"
}
```

**Save the `id`** for next steps.

#### 3. Start Bot

```bash
curl -X POST http://localhost:3000/bots/abc123/start \
  -H "Content-Type: application/json" \
  -d '{
    "env": {
      "BOT_TOKEN": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
      "ADMIN_USER_ID": "987654321"
    }
  }'
```

**Response:**
```json
{
  "status": "starting",
  "webhookUrl": "https://yourdomain.com/w/abc123"
}
```

#### 4. Verify Deployment

```bash
# Check bot status
curl http://localhost:3000/bots/abc123

# View logs
curl http://localhost:3000/bots/abc123/logs

# Check webhook
curl -X POST https://yourdomain.com/w/abc123/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id":1}'
```

Expected: `200 OK` response

#### 5. Test in Telegram

1. Open your bot in Telegram
2. Send `/start`
3. Complete registration flow
4. As admin, send `/stats` to verify data is saved

### Updating the Bot

```bash
# Stop current version
curl -X POST http://localhost:3000/bots/abc123/stop

# Rebuild (if code changed)
curl -X POST http://localhost:3000/bots/abc123/rebuild

# Start with new code
curl -X POST http://localhost:3000/bots/abc123/start \
  -H "Content-Type: application/json" \
  -d '{
    "env": {
      "BOT_TOKEN": "...",
      "ADMIN_USER_ID": "..."
    }
  }'
```

### Data Persistence

Bot Platform automatically mounts persistent volume:
```
/app/data → Docker volume
```

Data survives:
- ✅ Bot restarts
- ✅ Bot updates
- ✅ Container recreation

Data lost on:
- ❌ Volume deletion
- ❌ Swarm service removal with `--volumes`

**Backup strategy:**
```bash
# Export via bot
# (send /export command to bot)

# Or direct volume backup
docker run --rm \
  -v bot-abc123-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/registrations-backup.tar.gz /data
```

---

## Docker Deployment

Standalone Docker deployment without bot-platform.

### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Run
CMD ["node", "dist/index.js"]
```

### Build and Run

```bash
# Build image
docker build -t event-registration-bot .

# Run container
docker run -d \
  --name event-bot \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  -p 8080:8080 \
  event-registration-bot

# View logs
docker logs -f event-bot

# Stop
docker stop event-bot
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  event-bot:
    build: .
    container_name: event-registration-bot
    restart: unless-stopped
    environment:
      BOT_TOKEN: ${BOT_TOKEN}
      ADMIN_USER_ID: ${ADMIN_USER_ID}
      DEBUG: ${DEBUG:-false}
    volumes:
      - ./data:/app/data
    ports:
      - "8080:8080"
```

```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Production Checklist

### Pre-Launch

- [ ] Bot token obtained and secured
- [ ] Admin user ID set correctly
- [ ] QR codes generated and tested
- [ ] Registration flow tested end-to-end
- [ ] `/stats` and `/export` commands verified
- [ ] Data persistence configured
- [ ] Backup strategy established

### Infrastructure

- [ ] HTTPS enabled (required for webhooks)
- [ ] Reverse proxy configured (Caddy/Nginx)
- [ ] Webhook URL reachable from Telegram servers
- [ ] Container resource limits set (512MB RAM recommended)
- [ ] Logging configured and viewable

### Security

- [ ] `.env` file not committed to git
- [ ] Bot token not exposed in logs
- [ ] Admin commands restricted to `ADMIN_USER_ID`
- [ ] No sensitive data in callback data
- [ ] HTTPS certificates valid

### Monitoring

- [ ] Log aggregation setup (if needed)
- [ ] Disk space monitoring (for `data/` growth)
- [ ] Alert on bot downtime
- [ ] Regular backup schedule

### Event Day

- [ ] Bot status verified working
- [ ] QR codes printed and placed at venue
- [ ] Admin monitoring `/stats` for real-time counts
- [ ] Backup admin ready (if primary unavailable)

---

## Troubleshooting

### Bot Not Responding

**Symptoms:** Bot doesn't reply to `/start`

**Checks:**
```bash
# 1. Verify bot is running
curl http://localhost:3000/bots/abc123

# 2. Check logs for errors
curl http://localhost:3000/bots/abc123/logs | tail -50

# 3. Test webhook
curl -X POST https://yourdomain.com/w/abc123/webhook \
  -d '{"update_id":1,"message":{"chat":{"id":123},"text":"/start"}}'
```

**Common causes:**
- Invalid `BOT_TOKEN` → check token with BotFather
- Webhook not set → bot-platform should auto-set, verify with `getWebhookInfo`
- Container crashed → check logs for errors

### Commands Not Working

**Symptoms:** `/stats` or `/export` returns "no access"

**Fix:**
```bash
# Verify ADMIN_USER_ID is set
curl http://localhost:3000/bots/abc123 | jq .env.ADMIN_USER_ID

# Update if needed
curl -X POST http://localhost:3000/bots/abc123/start \
  -d '{"env":{"ADMIN_USER_ID":"YOUR_CORRECT_ID"}}'
```

### Search Not Finding Cities

**Symptoms:** Text search returns "not found" for valid city

**Checks:**
1. City exists in `src/data/cities.json`
2. Exact spelling (case-insensitive)
3. Search requires 2+ characters

**Fix:** Add missing cities to `cities.json`, rebuild bot

### Data Not Persisting

**Symptoms:** Registrations lost after restart

**Checks:**
```bash
# Verify volume is mounted
docker inspect event-bot | grep Mounts -A 10

# Check data directory permissions
docker exec event-bot ls -la /app/data
```

**Fix:**
```bash
# Ensure volume mapping in deployment
-v $(pwd)/data:/app/data  # Docker
# or for bot-platform, data is auto-mounted
```

### High Memory Usage

**Symptoms:** Container using >100MB RAM with <1000 users

**Diagnosis:**
```bash
# Check registration count
curl http://localhost:3000/bots/abc123/stats

# Memory usage
docker stats event-bot
```

**Fix:**
- Normal for 1000 users: ~60-80MB
- 10k users: ~100-150MB
- 100k+ users: migrate to database (see ARCHITECTURE.md)

### Webhook Certificate Errors

**Symptoms:** Logs show "certificate verify failed"

**Fix:**
```bash
# Ensure Caddy/proxy has valid HTTPS cert
# Telegram requires valid TLS

# Test certificate
curl -v https://yourdomain.com/w/abc123

# Update webhook manually (if needed)
curl "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://yourdomain.com/w/abc123"
```

### CSV Export Issues

**Symptoms:** `/export` command fails or produces empty file

**Checks:**
```bash
# Verify registrations exist
# (send /stats command first)

# Check data file
docker exec event-bot cat /app/data/registrations.json
```

**Fix:**
- If file missing: normal on first run, register a test user
- If file corrupt: restore from backup
- If command fails: check logs for error

---

## Backup & Recovery

### Backup Registrations

**Via Bot (recommended):**
```bash
# Send /export command to bot
# Saves CSV to Telegram
```

**Via Docker:**
```bash
# Copy data file
docker cp event-bot:/app/data/registrations.json ./backup/

# Or full volume backup
docker run --rm \
  -v bot-data:/data \
  -v $(pwd)/backup:/backup \
  alpine cp /data/registrations.json /backup/
```

### Restore from Backup

```bash
# Stop bot
docker stop event-bot

# Replace data file
docker cp ./backup/registrations.json event-bot:/app/data/

# Start bot
docker start event-bot
```

### Automated Backups

**Cron job (daily at 2 AM):**
```bash
# /etc/cron.d/event-bot-backup
0 2 * * * root docker exec event-bot cat /app/data/registrations.json > /backup/registrations-$(date +\%Y\%m\%d).json
```

---

## Scaling Considerations

### Current Limits
- **Users:** 10,000 registrations (tested)
- **Concurrent:** 100 requests/sec (Telegram API limit)
- **Storage:** ~10MB for 10k users

### When to Scale Up

**Migrate to PostgreSQL if:**
- >10k registrations expected
- Need concurrent writes
- Want ACID guarantees
- Require advanced queries

**Horizontal scaling:**
- Bot is stateless (except file storage)
- Can run multiple instances with shared Postgres
- Load balanced via bot-platform

### Migration Path

See `ARCHITECTURE.md` > Future Enhancements > Phase 3

---

## Support

- **Issues:** Check logs first, then [open issue](./CONTRIBUTING.md)
- **Bot Platform:** See `../../bot-platform/README.md`
- **grammY Docs:** https://grammy.dev
- **Telegram Bot API:** https://core.telegram.org/bots
