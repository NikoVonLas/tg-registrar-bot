# Quick Start (5 minutes)

Step-by-step guide to launch the bot for your event.

[🇷🇺 Русская версия](./QUICKSTART.md)

## Step 1: Create Bot (2 minutes)

1. Open Telegram and find **@BotFather**
2. Send command: `/newbot`
3. Choose bot name: `Event Registration Bot`
4. Choose username: `your_event_bot` (must end with `bot`)
5. **Save the token** (will look like this):
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz12345678
   ```

## Step 2: Get Admin ID (1 minute)

1. Open **@userinfobot** in Telegram
2. Send any message
3. **Save your User ID** (e.g.: `987654321`)

## Step 3: Launch Bot (2 minutes)

### Option A: Via Bot Platform (recommended)

```bash
# 1. Create bot
curl -X POST http://localhost:3000/bots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "event-registration",
    "runtime": "swarm",
    "sourceType": "local",
    "source": "./tgbots/prohodka"
  }'

# Save "id" from response (e.g.: abc123)

# 2. Start bot (replace abc123 with your ID)
curl -X POST http://localhost:3000/bots/abc123/start \
  -H "Content-Type: application/json" \
  -d '{
    "env": {
      "BOT_TOKEN": "PASTE_YOUR_TOKEN_HERE",
      "ADMIN_USER_ID": "PASTE_YOUR_USER_ID"
    }
  }'

# Done! Bot is running.
```

### Option B: Local (for testing)

```bash
# 1. Navigate to project folder
cd prohodka

# 2. Install dependencies (once)
npm install

# 3. Create .env file
cp .env.example .env

# 4. Edit .env (insert token and ID)
nano .env

# In file, replace:
BOT_TOKEN=your_token_from_step_1
ADMIN_USER_ID=your_id_from_step_2

# 5. Run
npm run dev

# Done! Bot is running in development mode.
```

## Step 4: Test

1. Open your bot in Telegram (using username from Step 1)
2. Send command: `/start`
3. Select your city
4. You should see: "✅ Great! You're registered."

### Test Admin Commands

1. Send: `/stats`
2. Should see statistics with your registration
3. Send: `/export`
4. Should receive CSV file

## Step 5: Create QR Code

1. Open https://qr-code-generator.com
2. Select type: **URL**
3. Paste link: `https://t.me/your_event_bot?start=event`
   - Replace `your_event_bot` with your bot's username
4. Download QR code (PNG, minimum 300x300px)
5. Print and place at event venue

### Example ready link:
```
https://t.me/your_event_bot?start=event
```

## Done! 🎉

Now:
- Attendees scan QR → open bot → register
- You track stats via `/stats`
- Export data via `/export` for analysis

---

## What's Next?

### Event Setup

1. **Print QR codes** (minimum 3-5 per event)
2. **Place at entrance** - so people scan when entering
3. **Add caption**: "Scan to register"

### Monitoring During Event

1. Open bot on phone
2. Periodically send `/stats`
3. View registration count in real-time

### After Event

1. Send `/export` - receive CSV
2. Open in Excel or Google Sheets
3. Analyze data:
   - Total attendance
   - Cities distribution
   - Registration timeline

---

## Help

### Bot Not Responding?

**Check:**
1. Token is correct (copied completely)
2. Bot is running (for Bot Platform: check status)
3. Webhook configured (Bot Platform does this automatically)

**View logs:**
```bash
# For Bot Platform
curl http://localhost:3000/bots/abc123/logs

# For local run
# Check console where you ran npm run dev
```

### Admin Commands Not Working?

**Check:**
1. `ADMIN_USER_ID` is set correctly
2. Your User ID matches what you specified
3. Restart bot with correct ID

### City Not Found?

**Solution:**
1. Open `src/data/cities.json`
2. Add city in alphabetical order
3. Rebuild: `npm run build`
4. Restart bot

---

## Additional Resources

- **Full documentation:** [README.en.md](./README.en.md)
- **Deployment guide:** [DEPLOYMENT.en.md](./DEPLOYMENT.en.md)
- **API reference:** [API.en.md](./API.en.md)
- **Architecture:** [ARCHITECTURE.en.md](./ARCHITECTURE.en.md)

---

**Questions?** See [FAQ in README](./README.en.md#faq) or create an issue on GitHub.
