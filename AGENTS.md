# Agent Guidelines for Event Registration Bot

## Project Overview
Event registration Telegram bot for tracking event attendance via QR codes. Built as a module for the bot-platform PaaS. Uses grammY framework, TypeScript, and JSON storage.

## Project Structure
```
prohodka/
├── src/
│   ├── index.ts          # Main bot logic, command handlers, callbacks
│   ├── storage.ts        # Registration persistence (JSON-based)
│   └── data/
│       └── cities.json   # 160+ Russian cities database
├── package.json          # Dependencies + bot manifest
├── tsconfig.json         # TypeScript config (extends bot-platform base)
└── data/                 # Runtime storage (gitignored)
    └── registrations.json
```

## Key Design Decisions

### Why JSON Storage Instead of Database?
- **Portability**: Works in any container without external dependencies
- **Simplicity**: No schema migrations, direct file I/O
- **Scale**: Suitable for events with <10k attendees
- **Future**: Easy to migrate to SQLite/Postgres if needed (interface already abstracted in `storage.ts`)

### Why Three City Selection Methods?
1. **Geolocation** (prepared, not fully implemented): Fastest for users, requires geocoding API
2. **Top-15 Cities**: Covers ~70% of Russian users, zero typing errors
3. **Text Search**: Handles remaining 30%, allows partial matching

This UX balances speed (most users click once) with flexibility (everyone can find their city).

### Why Inline Keyboard Instead of Reply Keyboard?
- Cleaner UI, messages don't clutter chat
- Better for one-time registration flow
- Callbacks preserve state without extra messages

## Development Commands

### Local Development
```bash
npm install              # Install dependencies
npm run dev             # Start with hot reload (ts-node-dev)
npm run build           # Compile TypeScript to dist/
```

### Integration with bot-platform
```bash
# From bot-platform root:
curl -X POST http://localhost:3000/bots \
  -d '{"name":"event-reg","runtime":"swarm","sourceType":"local","source":"./tgbots/prohodka"}'

curl -X POST http://localhost:3000/bots/{id}/start \
  -d '{"env":{"BOT_TOKEN":"...","ADMIN_USER_ID":"..."}}'
```

## Code Style & Conventions

### File Organization
- **index.ts**: Bot setup function, all command/callback handlers, keyboard builders
- **storage.ts**: Data persistence layer (abstracted interface)
- **data/cities.json**: Static city list (alphabetically sorted)

### Naming Conventions
- Callback data: `CB.CITY('Moscow')` → `"city:Moscow"`
- Keyboards: `createTopCitiesKeyboard()`, `createSearchResultsKeyboard(query)`
- Handlers: `handleCitySelection(ctx, city)`

### TypeScript
- Strict mode enabled
- All async handlers properly typed with grammY Context
- JSON imports enabled via `resolveJsonModule`

## Adding Features

### Adding a New City Selection Method
1. Add keyboard builder function (e.g., `createRegionKeyboard()`)
2. Add callback handler with pattern (e.g., `bot.callbackQuery(/^region:(.+)$/,...)`)
3. Update CB constants at top of index.ts
4. Test flow: start → new method → city selection → registration

### Integrating Geocoding API
Replace `reverseGeocode()` stub in index.ts:
```typescript
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  // Option 1: Nominatim (free, OpenStreetMap)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
  );
  const data = await response.json();
  return data.address?.city || data.address?.town || null;

  // Option 2: Dadata.ru (10k free requests/day)
  // Option 3: Google Geocoding API (paid)
}
```

### Switching to Database Storage
1. Create new storage class implementing same interface:
   ```typescript
   class SqliteStorage {
     isRegistered(userId: number): boolean { ... }
     register(...): Registration { ... }
     // ... rest of RegistrationStorage interface
   }
   ```
2. Replace `storage` instance in index.ts
3. Run migrations on container startup

### Adding Analytics/Metrics
Export handlers already provide:
- CSV export via `/export` command
- Real-time stats via `/stats` command
- Raw data in `data/registrations.json`

To add external analytics:
1. Send events to analytics service in `handleCitySelection()`
2. Add webhook notification on registration (e.g., to Slack)
3. Integrate with Metrika/GA via Bot API webhooks

## Testing Guidelines

### Manual Testing Checklist
- [ ] `/start` shows location + manual buttons
- [ ] Manual selection shows top-15 cities
- [ ] Clicking city completes registration
- [ ] Second `/start` shows "already registered"
- [ ] Search with valid query shows results
- [ ] Search with invalid query shows "not found"
- [ ] `/stats` works for admin user
- [ ] `/export` generates valid CSV
- [ ] Non-admin cannot access admin commands

### Bot Platform Integration Testing
1. Build succeeds: `POST /bots` with source pointing to this directory
2. Start succeeds: `POST /bots/{id}/start` with valid BOT_TOKEN
3. Webhook responds: `curl -X POST https://domain/w/{id}/webhook` returns 200
4. Logs available: `GET /bots/{id}/logs` shows bot initialization

## Common Issues & Solutions

### "Module not found: ./data/cities.json"
- Ensure `resolveJsonModule: true` in tsconfig.json
- Check `src/data/cities.json` exists

### "Cannot read registrations.json"
- Normal on first run (file created automatically)
- Ensure container has write permissions to `data/` directory

### Stats command not responding
- Check `ADMIN_USER_ID` env var is set
- Get your ID from @userinfobot on Telegram

### Bot not responding to callbacks
- Ensure `await ctx.answerCallbackQuery()` is called in all callback handlers
- Check callback data matches patterns (e.g., `city:Moscow`, not `cityMoscow`)

## Environment Variables

**Required:**
- `BOT_TOKEN` - from @BotFather

**Optional:**
- `ADMIN_USER_ID` - your Telegram user ID for admin commands
- `DEBUG` - enable verbose logging

**Bot Platform (auto-provided):**
- `BOT_ID` - unique bot instance ID
- `PORT` - webhook server port (8080)
- `WEBHOOK_URL` - full webhook URL
- `TELEGRAM_API_BASE` - local Bot API endpoint (optional)

## Security Notes

- No sensitive data in registrations (only public profile info)
- Admin commands protected by `ADMIN_USER_ID` check
- No SQL injection risk (JSON storage)
- No XSS risk (Telegram sanitizes Markdown)
- Rate limiting handled by Telegram Bot API

## Performance Considerations

- JSON file I/O: O(n) read/write on registration
- Search: O(n) linear scan through cities (160 items, negligible)
- Callback data size: <64 bytes per button (Telegram limit)
- Memory: ~1MB for 1000 registrations

**Scaling:**
- Up to 10k registrations: current JSON approach is fine
- 10k-100k: migrate to SQLite
- 100k+: migrate to PostgreSQL with read replicas

## Deployment Checklist

- [ ] Create bot via @BotFather, get token
- [ ] Generate QR code with bot link
- [ ] Set ADMIN_USER_ID in environment
- [ ] Deploy via bot-platform API
- [ ] Test registration flow end-to-end
- [ ] Print and place QR codes at event venue
- [ ] Monitor `/stats` during event

## Contributing

When adding features:
1. Follow existing code structure (keyboards → callbacks → handlers)
2. Update this AGENTS.md with new patterns
3. Add entries to CHANGELOG.md
4. Test both standalone and bot-platform deployment
5. Keep bot manifest in package.json up-to-date

## Useful Resources

- grammY docs: https://grammy.dev
- Bot API reference: https://core.telegram.org/bots/api
- Bot Platform repo: `../../bot-platform/`
- Russian cities data: https://ru.wikipedia.org/wiki/Города_России
