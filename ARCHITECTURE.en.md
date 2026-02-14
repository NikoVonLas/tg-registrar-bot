# Architecture Documentation

[🇷🇺 Русская версия](./ARCHITECTURE.md)

## System Overview

Event Registration Bot is a Telegram bot for QR-code-based event registration with city tracking. Built as standalone module compatible with bot-platform PaaS.

```
QR Code (t.me/bot) → Telegram Bot API (webhook) → Bot Logic (grammY)
                                                      ↓
                                              Storage Layer (JSON)
                                                      ↓
                                              Static Data (cities.json)
```

## Component Architecture

### 1. Bot Entry Point (`src/index.ts`)
- Exports grammY setup function
- Registers command and callback handlers
- Builds inline keyboards
- Coordinates registration flow

### 2. Storage Layer (`src/storage.ts`)
- Interface: `isRegistered()`, `register()`, `getStats()`
- JSON persistence at `data/registrations.json`
- In-memory Map for fast lookups
- Synchronous writes after each registration

### 3. Static Data (`src/data/cities.json`)
- 160+ Russian cities alphabetically sorted
- Top-15 for quick selection
- Full list for search

## User Flow State Machine

```
START → Already registered? 
         Yes → Show existing
         No  → Choose method (Location/Manual)
              Manual → Top-15 cities + Search
                       Search → Text input → Results
                                            → Select city
                                                → Save → Success
```

## Callback Data Schema

| Prefix | Example | Handler |
|--------|---------|---------|
| `city:` | `city:Moscow` | Select city |
| - | `manual_select` | Show top-15 |
| - | `search_city` | Enter search mode |
| - | `back_to_cities` | Return to top-15 |

## Performance

| Operation | Target | Bottleneck |
|-----------|--------|------------|
| `/start` | <500ms | Keyboard generation |
| City click | <200ms | JSON write |
| Search | <300ms | Array filter |
| `/stats` | <1s | JSON read + aggregation |

## Scaling Limits

- 10k users: ~10MB JSON, 1-2s startup
- 100k users: ~100MB JSON, 10-20s startup → **migrate to DB**

## Security

- Auth: Telegram user ID (verified by Telegram)
- Admin: `ADMIN_USER_ID` env var check
- No sensitive data stored
- HTTPS enforced by Telegram

## Future Enhancements

- Geocoding API integration
- PostgreSQL storage adapter
- Multi-event support
- Real-time dashboard

## References

- [grammY](https://grammy.dev)
- [Bot API](https://core.telegram.org/bots/api)
- [Bot Platform](../../bot-platform/)
