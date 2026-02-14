# API Documentation

[Russian version](./API.ru.md)

## User Commands

### /start

Register for event. Shows city selection if new user, or existing registration if already registered.

### /help

Display available commands.

## Admin Commands

Requires `ADMIN_USER_ID` environment variable.

### /stats

View registration statistics by city.

Response format:
```
Registration Statistics

Total registered: 42

By cities:
• Moscow: 15
• St. Petersburg: 8
...
```

### /export

Export all registrations to CSV file.

CSV format:
```csv
UserID,Username,FirstName,LastName,City,RegisteredAt
123456789,"user","Ivan","Ivanov","Moscow","2026-02-14T12:34:56.789Z"
```

## Callback Queries

### city:<name>

Select city and complete registration.

Pattern: `^city:(.+)$`

### manual_select

Show top-15 cities keyboard.

### search_city

Enter text search mode.

### back_to_cities

Return to top-15 cities list.

## Message Handlers

### Text Search

Trigger: Text message (not command, 2+ characters)

Behavior: Filter cities by substring, show up to 20 results.

### Location

Trigger: User shares location

Behavior: Extract coordinates, geocode (stub), fallback to manual selection.

## Data Structures

### Registration

```typescript
interface Registration {
  userId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  city: string;
  registeredAt: string;  // ISO 8601
}
```

### Statistics

```typescript
interface Stats {
  total: number;
  byCities: Record<string, number>;
}
```

## Inline Keyboards

**Initial:**
```
[Share Location]
[Choose Manually]
```

**Top-15 (2 columns):**
```
[Moscow]    [St. Petersburg]
[City3]     [City4]
...
[Find another city]
```

**Search Results (2 columns, max 20):**
```
[City1] [City2]
...
[← Back]
```

## Rate Limits

- 30 messages/sec to different users
- 1 message/sec to same user

Expected load: ~20 registrations/minute peak

## Webhook

**Endpoint:** `https://domain/w/<bot_id>`  
**Method:** POST  
**Body:** Telegram Update object

Response: `200 OK` on success

See [grammY docs](https://grammy.dev) and [Bot API](https://core.telegram.org/bots/api) for details.
