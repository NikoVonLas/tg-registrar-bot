# Agent Guidelines for Event Registration Bot

[🇷🇺 Русская версия](./AGENTS.md)

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

### Why JSON Storage?
- **Portability**: Works in any container without external dependencies
- **Simplicity**: No schema migrations, direct file I/O
- **Scale**: Suitable for events with <10k attendees
- **Future**: Easy to migrate to SQLite/Postgres if needed

### Why Three City Selection Methods?
1. **Geolocation**: Fastest for users, requires geocoding API
2. **Top-15 Cities**: Covers ~70% of Russian users, zero typing errors
3. **Text Search**: Handles remaining 30%, allows partial matching

### Why Inline Keyboard?
- Cleaner UI, messages don't clutter chat
- Better for one-time registration flow
- Callbacks preserve state without extra messages

## Development Commands

```bash
npm install              # Install dependencies
npm run dev             # Start with hot reload
npm run build           # Compile TypeScript

# Bot Platform integration
curl -X POST http://localhost:3000/bots \
  -d '{"name":"event-reg","sourceType":"local","source":"./tgbots/prohodka"}'
```

## Code Style & Conventions

**Naming:**
- Variables/Functions: `camelCase`
- Classes/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

**TypeScript:**
- Strict mode enabled
- Avoid `any`
- Use optional chaining: `ctx.from?.username`
- Prefer `const` over `let`

## Testing Guidelines

### Manual Testing Checklist
- [ ] `/start` - New user registration
- [ ] `/start` - Already registered
- [ ] Top-15 city selection
- [ ] Text search (valid/invalid)
- [ ] `/stats` - Admin only
- [ ] `/export` - CSV generation

## Common Issues & Solutions

**"Module not found: cities.json"**
→ Ensure `resolveJsonModule: true` in tsconfig.json

**Stats command not responding**
→ Check `ADMIN_USER_ID` env var matches your Telegram ID

**Bot not responding to callbacks**
→ Ensure `await ctx.answerCallbackQuery()` in all handlers

## Performance

- JSON file I/O: O(n) read/write
- Search: O(n) linear scan (160 items, negligible)
- Memory: ~60MB for 1k registrations
- Scaling: Up to 10k OK, then migrate to DB

## Security

- Admin commands protected by `ADMIN_USER_ID`
- No sensitive data stored
- Rate limiting handled by Telegram API

## Resources

- [grammY docs](https://grammy.dev)
- [Bot API](https://core.telegram.org/bots/api)
- [Bot Platform](../../bot-platform/)
