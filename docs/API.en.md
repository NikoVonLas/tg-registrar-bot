# API Documentation

Complete reference for bot commands, callbacks, and data structures.

[🇷🇺 Русская версия](./API.md)

## User Commands

### `/start` - Begin Registration

Entry point for new users. Checks registration status and starts flow.

**If already registered:**
```
You're already registered!
Your city: Moscow
Registration time: 14.02.2026, 12:34:56
```

**If not registered:**
```
 Welcome to the event!

Please select your city:
[ Share Location]
[ Choose Manually]
```

### `/help` - Show Help

Displays available commands.

## Admin Commands

**Authorization:** Requires `ADMIN_USER_ID` environment variable.

### `/stats` - View Statistics

Shows real-time registration statistics by city.

**Response:**
```
 Registration Statistics

 Total registered: 42

 By cities:
• Moscow: 15
• St. Petersburg: 8
• Novosibirsk: 5
...
```

### `/export` - Export Data

Generates CSV file with all registrations.

**File Format:**
```csv
UserID,Username,FirstName,LastName,City,RegisteredAt
123456789,"user","Ivan","Ivanov","Moscow","2026-02-14T12:34:56.789Z"
```

## Callback Queries

### City Selection: `city:<name>`

**Pattern:** `^city:(.+)$`
**Example:** `city:Moscow`

Validates city and creates registration.

### Manual Selection: `manual_select`

Shows top-15 cities keyboard.

### Search Mode: `search_city`

Switches to text input for city search.

### Back: `back_to_cities`

Returns to top-15 cities list.

## Message Handlers

### Text Search

**Trigger:** Text message (not command, not registered, 2+ chars)

Filters cities by substring, shows up to 20 results.

### Location Message

**Trigger:** User shares location

Extracts coordinates, calls geocoding (stub), falls back to manual selection.

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

**Initial Choice:**
```
[ Share Location]
[ Choose Manually]
```

**Top-15 Cities (2 columns):**
```
[Moscow]     [St. Petersburg]
[Novosibirsk][Yekaterinburg]
...
[ Find another city]
```

**Search Results (2 columns, max 20):**
```
[City1][City2]
[City3][City4]
...
[← Back to top-15]
```

## Rate Limits

- 30 messages/sec to different users
- 1 message/sec to same user
- Expected load: ~20 registrations/minute peak (easily handled)

## Webhook Integration

**Endpoint:** `https://domain/w/<bot_id>`
**Method:** `POST`
**Body:** Telegram Update object

**Response:**
- `200 OK` - Success
- `500 Internal Server Error` - Bot error

## References

- [grammY](https://grammy.dev)
- [Bot API](https://core.telegram.org/bots/api)
