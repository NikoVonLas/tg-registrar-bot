# Architecture Documentation

## System Overview

Event Registration Bot is a Telegram bot designed for QR-code-based event registration with city tracking. Built as a standalone module compatible with bot-platform PaaS.

```
┌─────────────┐
│   QR Code   │ (printed at venue)
│  t.me/bot   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         Telegram Bot API                │
│  (webhook mode via bot-platform)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│     Event Registration Bot               │
│  ┌────────────────────────────────────┐  │
│  │  Bot Logic (grammY framework)      │  │
│  │  ├─ Command handlers (/start, etc) │  │
│  │  ├─ Callback handlers (buttons)    │  │
│  │  ├─ Message handlers (text search) │  │
│  │  └─ Admin commands (/stats, etc)   │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │  Storage Layer                     │  │
│  │  (JSON file persistence)           │  │
│  │  └─ data/registrations.json        │  │
│  └────────────────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │  Static Data                       │  │
│  │  └─ src/data/cities.json (160+)   │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Component Architecture

### 1. Bot Entry Point (`src/index.ts`)

**Responsibilities:**
- Export grammY setup function for bot-platform
- Register all command and callback handlers
- Build inline keyboards
- Coordinate user registration flow

**Key Functions:**
```typescript
export default function setup(bot: Bot) {
  // Command handlers
  bot.command("start", ...)
  bot.command("stats", ...)
  bot.command("export", ...)

  // Callback handlers
  bot.callbackQuery(pattern, ...)

  // Message handlers
  bot.on("message:text", ...)
  bot.on("message:location", ...)
}
```

**Design Pattern:** Single responsibility + dependency injection (bot instance provided by platform)

### 2. Storage Layer (`src/storage.ts`)

**Interface:**
```typescript
class RegistrationStorage {
  isRegistered(userId: number): boolean
  register(userId, city, userInfo): Registration
  getRegistration(userId): Registration | undefined
  getAllRegistrations(): Registration[]
  getStats(): { total, byCities }
}
```

**Data Model:**
```typescript
interface Registration {
  userId: number           // Telegram user ID (unique)
  username?: string        // @handle
  firstName?: string       // Profile first name
  lastName?: string        // Profile last name
  city: string            // Selected city
  registeredAt: string    // ISO 8601 timestamp
  qrScan?: string         // Future: QR code identifier
}
```

**Persistence Strategy:**
- **Current:** JSON file at `data/registrations.json`
- **Load:** Eagerly on startup into `Map<userId, Registration>`
- **Save:** Synchronously after each registration
- **Concurrency:** None (single bot instance, sequential webhook processing)

**Why JSON?**
- Simple, no dependencies
- Human-readable for debugging
- Easy backup/export
- Suitable for <10k registrations

**Migration Path to DB:**
1. Implement same interface with SQL queries
2. Replace storage instance
3. Add migrations for schema versioning

### 3. Static Data (`src/data/cities.json`)

**Format:** Array of strings, alphabetically sorted
```json
["Москва", "Санкт-Петербург", "Новосибирск", ...]
```

**Size:** 160+ cities (all major Russian cities)

**Usage:**
- Top-15 for quick selection buttons
- Full list for text search
- Validation on city selection

**Extensibility:** Add cities by editing JSON, rebuild bot

## User Flow State Machine

```
                    ┌─────────┐
                    │  START  │
                    └────┬────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Already registered?  │
              └──────┬───────┬───────┘
                 YES │       │ NO
                     │       │
        ┌────────────┘       └────────────┐
        │                                  │
        ▼                                  ▼
   ┌─────────┐                    ┌────────────────┐
   │ Show    │                    │ Choose method: │
   │ existing│                    │ • Location     │
   │ city    │                    │ • Manual       │
   └─────────┘                    └───────┬────────┘
                                          │
                         ┌────────────────┼────────────────┐
                         │                │                │
                    Location          Manual           (future)
                         │                │
                         ▼                ▼
                  ┌──────────┐    ┌──────────────┐
                  │Geocode   │    │ Top-15 cities│
                  │(future)  │    │ + Search btn │
                  └────┬─────┘    └──────┬───────┘
                       │                 │
                       │      ┌──────────┴──────────┐
                       │      │                     │
                       │   Select                Search
                       │      │                     │
                       │      ▼                     ▼
                       │  ┌────────┐        ┌──────────────┐
                       │  │ City   │        │ Text input   │
                       │  │clicked │        │ → Results    │
                       │  └───┬────┘        └──────┬───────┘
                       │      │                    │
                       └──────┴────────┬───────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Save to storage │
                              │ Show success  │
                              └─────────────────┘
```

## Callback Data Schema

All inline keyboard callbacks use prefixed strings:

| Prefix | Pattern | Example | Handler |
|--------|---------|---------|---------|
| `city:` | `city:<name>` | `city:Москва` | Select city |
| `sq:` | `sq:<query>` | `sq:новосиб` | Search query (unused) |
| - | `use_location` | - | Request geolocation |
| - | `manual_select` | - | Show top-15 cities |
| - | `search_city` | - | Enter search mode |
| - | `back_to_cities` | - | Return to top-15 |

**Size Limits:** Telegram allows 64 bytes per callback_data. Longest city name: ~20 chars → safe.

## Keyboard Generation

### Strategy: Dynamic Generation
Keyboards are generated on-demand per user interaction, not pre-cached. This keeps code simple and allows future personalization (e.g., user's region first).

### Layouts:

**1. Initial Choice (2 buttons, vertical):**
```
┌─────────────────────────┐
│  Share Location       │
└─────────────────────────┘
┌─────────────────────────┐
│  Choose manually      │
└─────────────────────────┘
```

**2. Top-15 Cities (2 columns):**
```
┌──────────────┬──────────────┐
│ Москва       │ Санкт-Пб     │
├──────────────┼──────────────┤
│ Новосибирск  │ Екатеринбург │
├──────────────┴──────────────┤
│ ...                         │
├─────────────────────────────┤
│  Find another city        │
└─────────────────────────────┘
```

**3. Search Results (2 columns, max 20 results):**
```
┌──────────────┬──────────────┐
│ Новосибирск  │ Новокузнецк  │
├──────────────┼──────────────┤
│ Новороссийск │ ...          │
├──────────────┴──────────────┤
│ ← Back to top-15            │
└─────────────────────────────┘
```

### Why 2 columns?
- Mobile-friendly tap targets
- Fits 15-20 cities on one screen
- Faster scrolling than single column

## Security Model

### Authentication
- **User identity:** Telegram user ID (verified by Telegram)
- **Admin access:** Hardcoded `ADMIN_USER_ID` env var check
- **No passwords:** All auth via Telegram's OAuth

### Authorization Matrix

| Action | User | Admin |
|--------|------|-------|
| Register |  (once) |  |
| View own registration |  |  |
| View all registrations |  |  (`/stats`) |
| Export data |  |  (`/export`) |

### Data Privacy
- Stored data: public profile info only (user ID, username, first/last name, city)
- No phone numbers, emails, or private data
- City selection voluntary (but required for registration)

### Threat Model
**In scope:**
- Bot token leakage → rotate token via @BotFather
- Spam registrations → rate limiting by Telegram API
- Data loss → regular backups of `data/registrations.json`

**Out of scope:**
- DDoS (handled by bot-platform + Caddy)
- Man-in-the-middle (HTTPS enforced by Telegram)
- User impersonation (impossible without Telegram account compromise)

## Performance Characteristics

### Latency Budget (per request)

| Operation | Target | Bottleneck |
|-----------|--------|------------|
| `/start` (new user) | <500ms | Keyboard generation |
| City button click | <200ms | JSON file write |
| Text search | <300ms | Array filter (160 items) |
| `/stats` | <1s | JSON file read + aggregation |
| `/export` | <2s | CSV generation |

### Memory Usage

| Component | Size | Notes |
|-----------|------|-------|
| Node.js runtime | ~50MB | Base overhead |
| grammY framework | ~5MB | Lightweight |
| Cities data | <10KB | 160 strings |
| Registrations | ~1KB/user | 1000 users = 1MB |
| **Total (1k users)** | **~60MB** | Fits in 128MB container |

### Storage I/O

**Read operations:**
- On startup: Load `registrations.json` into memory
- Per registration: None (in-memory lookup)
- `/stats`, `/export`: Read full file

**Write operations:**
- Per registration: Synchronous write to `registrations.json`
- Frequency: ~1 write per new user

**Scaling limits:**
- 10k users: ~10MB JSON, 1-2s to parse on startup
- 100k users: ~100MB JSON, 10-20s to parse → migrate to DB

## Error Handling

### Strategy: Fail gracefully, log errors

**User-facing errors:**
```typescript
try {
  // operation
} catch (error) {
  await ctx.reply("Произошла ошибка. Попробуйте /start снова.");
  console.error("Error in handler:", error);
}
```

**Admin-facing errors:**
```typescript
if (!adminId || ctx.from?.id.toString() !== adminId) {
  await ctx.reply("У вас нет доступа к этой команде.");
  return;
}
```

### Retry Logic
- None needed (Telegram bot API handles retries)
- File I/O: Fail fast (if disk full, alert operator)

### Monitoring Hooks
- Console logs (captured by bot-platform)
- Future: Send critical errors to admin via DM

## Deployment Architecture

### Standalone Mode
```
┌──────────────────────────┐
│ Node.js Process          │
│ ├─ Bot polling           │
│ ├─ Storage (JSON)        │
│ └─ data/ directory       │
└──────────────────────────┘
```

### Bot Platform Mode (Production)
```
┌────────────────────────────────────────┐
│ Docker Swarm / Kubernetes              │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Caddy (reverse proxy)            │ │
│  │ HTTPS, /w/<bot_id> routing       │ │
│  └────────────┬─────────────────────┘ │
│               │                        │
│  ┌────────────▼─────────────────────┐ │
│  │ bot-<id> container               │ │
│  │ ├─ Runtime server (webhook)      │ │
│  │ ├─ grammY bot                    │ │
│  │ └─ /data volume (persistent)     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ bot-manager (control plane)      │ │
│  │ ├─ API (create/start/stop)       │ │
│  │ ├─ Build images                  │ │
│  │ └─ Set webhooks                  │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Volume mapping:**
- `/app/data` → persistent volume (registrations survive restarts)

**Environment injection:**
- `BOT_TOKEN`, `ADMIN_USER_ID` → secrets
- `BOT_ID`, `WEBHOOK_URL` → auto-provided

## Future Enhancements

### Phase 2: Geocoding Integration
```typescript
// Add API client
import { DadataClient } from './geocoding';

async function reverseGeocode(lat, lon) {
  const client = new DadataClient(process.env.DADATA_API_KEY);
  return await client.geocode(lat, lon);
}
```

**Impact:**
- +1 API dependency
- +100-200ms latency per geolocation request
- Better UX for users willing to share location

### Phase 3: Database Migration
```typescript
// Replace storage implementation
import { PostgresStorage } from './storage/postgres';

const storage = new PostgresStorage(process.env.DATABASE_URL);
```

**Impact:**
- +1 infrastructure dependency (Postgres)
- Better performance for 10k+ users
- ACID guarantees, concurrent writes
- Schema migrations needed

### Phase 4: Multi-Event Support
```typescript
interface Registration {
  // ... existing fields
  eventId: string;  // NEW: support multiple events
}

bot.command("start", async (ctx) => {
  const eventId = ctx.match; // from QR code param
  // ... register for specific event
});
```

**Impact:**
- Breaking change to storage schema
- Separate QR codes per event
- Stats per event

### Phase 5: Real-time Dashboard
```typescript
// WebSocket server for live stats
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8081 });
// Broadcast registrations to connected dashboards
```

**Impact:**
- +1 service (dashboard frontend)
- +1 protocol (WebSocket)
- Real-time event monitoring

## Technology Choices Rationale

| Choice | Alternatives | Why Chosen |
|--------|-------------|------------|
| grammY | Telegraf, node-telegram-bot-api | Modern, TypeScript-first, active development |
| JSON storage | SQLite, MongoDB, Postgres | Simplest for MVP, no dependencies |
| Inline keyboards | Reply keyboards, inline queries | Cleaner UX, no chat clutter |
| TypeScript | JavaScript | Type safety, better DX |
| Webhook mode | Long polling | Required by bot-platform, more efficient |

## References

- [grammY Documentation](https://grammy.dev)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Bot Platform AGENTS.md](../../bot-platform/AGENTS.md)
