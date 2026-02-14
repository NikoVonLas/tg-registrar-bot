# API Documentation

Complete reference for bot commands, callbacks, and data structures.

## Table of Contents
1. [User Commands](#user-commands)
2. [Admin Commands](#admin-commands)
3. [Callback Queries](#callback-queries)
4. [Message Handlers](#message-handlers)
5. [Data Structures](#data-structures)
6. [Response Formats](#response-formats)

---

## User Commands

### `/start` - Begin Registration

**Description:** Entry point for new users. Checks registration status and starts registration flow.

**Usage:**
```
/start
```

**Parameters:** None (future: event ID via deep link)

**Behavior:**

**If already registered:**
```
Вы уже зарегистрированы!

Ваш город: Москва
Время регистрации: 14.02.2026, 12:34:56
```

**If not registered:**
```
🎉 Добро пожаловать на мероприятие!

Для регистрации, пожалуйста, выберите ваш город:

📍 Вы можете поделиться местоположением (быстрее всего)
🏙 Или выбрать город из списка

[📍 Share Location Button]
[🏙 Choose Manually Button]
```

**Deep Link Support (future):**
```
https://t.me/your_bot?start=event123
/start event123
```

---

### `/help` - Show Help

**Description:** Displays available commands and usage info.

**Usage:**
```
/help
```

**Response:**
```markdown
ℹ️ *Команды бота:*

/start - Регистрация на мероприятие
/help - Эта справка

_Для администраторов:_
/stats - Статистика регистраций
/export - Экспорт данных в CSV
```

---

## Admin Commands

**Authorization:** All admin commands require `ADMIN_USER_ID` environment variable to be set and match sender's Telegram user ID.

### `/stats` - View Statistics

**Description:** Shows real-time registration statistics.

**Usage:**
```
/stats
```

**Authorization:** Admin only

**Response:**
```markdown
📊 *Статистика регистраций*

👥 Всего зарегистрировано: *42*

🏙 *По городам:*
• Москва: 15
• Санкт-Петербург: 8
• Новосибирск: 5
• Екатеринбург: 3
• Казань: 2
• Самара: 2
• Омск: 2
• Воронеж: 1
• Красноярск: 1
• Пермь: 1
• Краснодар: 1
• Тюмень: 1

_...и ещё 5 городов_
```

**Data Format:**
- Total count
- Top 20 cities sorted by count (descending)
- Indication if more cities exist

**Performance:** O(n) scan of all registrations, typically <100ms for 1000 users

---

### `/export` - Export Data

**Description:** Generates CSV file with all registration data.

**Usage:**
```
/export
```

**Authorization:** Admin only

**Response:** Document attachment with caption:
```
📥 Экспорт данных: 42 записей
```

**File Format:** CSV (UTF-8)
```csv
UserID,Username,FirstName,LastName,City,RegisteredAt
123456789,"username","Иван","Иванов","Москва","2026-02-14T12:34:56.789Z"
987654321,"user2","Петр","Петров","Санкт-Петербург","2026-02-14T13:45:01.234Z"
```

**Fields:**
- `UserID` - Telegram user ID (numeric)
- `Username` - @handle (may be empty)
- `FirstName` - Profile first name
- `LastName` - Profile last name (may be empty)
- `City` - Selected city
- `RegisteredAt` - ISO 8601 timestamp

**File Naming:** `registrations_<timestamp>.csv`

**Use Cases:**
- Import to Excel/Google Sheets for analysis
- Backup before updates
- Share with event organizers

---

## Callback Queries

All inline keyboard interactions use callback queries.

### City Selection: `city:<name>`

**Pattern:** `^city:(.+)$`

**Example:** `city:Москва`

**Trigger:** User clicks city button (from top-15 or search results)

**Behavior:**
1. Validate city exists in `cities.json`
2. Create registration record
3. Update message with success

**Response:**
```markdown
✅ Отлично! Вы зарегистрированы.

Ваш город: *Москва*
Время регистрации: 14.02.2026, 12:34:56

Добро пожаловать на мероприятие! 🎉
```

**Callback Answer:** `✅ Город выбран: Москва`

**Error Handling:**
- Invalid city → `❌ Некорректный город`
- Already registered → No-op (shouldn't happen)

---

### Manual Selection: `manual_select`

**Trigger:** User clicks "🏙 Choose manually" button

**Behavior:** Show top-15 cities keyboard

**Response:**
```
Выберите ваш город из списка самых популярных:

Или используйте поиск, если вашего города нет в списке.

[Moscow] [Saint Petersburg]
[Novosibirsk] [Yekaterinburg]
...
[🔍 Find another city]
```

---

### Search Mode: `search_city`

**Trigger:** User clicks "🔍 Найти другой город"

**Behavior:** Switch to text input mode

**Response:**
```markdown
🔍 *Поиск города*

Напишите название вашего города (можно часть названия).
Например: "Новосиб" найдёт "Новосибирск"
```

**Next Step:** User sends text message → search handler

---

### Back to Cities: `back_to_cities`

**Trigger:** User clicks "← Назад к топ-15" from search results

**Behavior:** Return to top-15 cities keyboard

**Response:** Same as `manual_select`

---

### Location Request: `use_location` (future)

**Status:** Prepared but not fully implemented

**Trigger:** User clicks "📍 Share Location"

**Expected Behavior:**
1. Request location via reply keyboard
2. Receive `message:location`
3. Geocode coordinates → city
4. Confirm city with user

**Current Behavior:** Button exists but geocoding returns `null`

---

## Message Handlers

### Text Search

**Trigger:** User sends text message (not a command)

**Conditions:**
- Not already registered
- Not a command (doesn't start with `/`)
- Minimum 2 characters

**Behavior:**
1. Filter `cities.json` by substring match (case-insensitive)
2. Show up to 20 results as inline keyboard
3. If no results, show "not found" message

**Example Input:** `новосиб`

**Response:**
```
Результаты поиска по "новосиб":

[Новосибирск] [Новосибирская]
...
[← Back to list]
```

**No Results:**
```markdown
😞 Не найдено городов по запросу "*asdf*"

Попробуйте другой вариант или выберите из топ-15.

[← К списку городов]
```

**Performance:** O(n) linear scan, ~1ms for 160 cities

---

### Location Message

**Trigger:** User shares location via Telegram's location button

**Condition:** Not already registered

**Behavior:**
1. Extract `latitude`, `longitude`
2. Call `reverseGeocode(lat, lon)`
3. If city found and valid → confirm
4. Else → fallback to manual selection

**Current Status:** Geocoding stub returns `null`, always falls back to manual

**Future Implementation:**
```typescript
async function reverseGeocode(lat, lon) {
  const res = await fetch(`https://nominatim.../reverse?lat=${lat}&lon=${lon}`);
  const data = await res.json();
  const city = data.address?.city;
  return cities.includes(city) ? city : null;
}
```

---

## Data Structures

### Registration

**TypeScript Interface:**
```typescript
interface Registration {
  userId: number;           // Telegram user ID (primary key)
  username?: string;        // @handle (optional, may be undefined)
  firstName?: string;       // Profile first name (optional)
  lastName?: string;        // Profile last name (optional)
  city: string;            // Selected city (required)
  registeredAt: string;    // ISO 8601 timestamp
  qrScan?: string;         // Future: QR code ID (optional)
}
```

**JSON Example:**
```json
{
  "userId": 123456789,
  "username": "ivanivanov",
  "firstName": "Иван",
  "lastName": "Иванов",
  "city": "Москва",
  "registeredAt": "2026-02-14T12:34:56.789Z"
}
```

**Storage Format:** JSON array in `data/registrations.json`
```json
[
  { "userId": 123, ... },
  { "userId": 456, ... }
]
```

---

### Statistics

**TypeScript Interface:**
```typescript
interface Stats {
  total: number;
  byCities: Record<string, number>;
}
```

**Example:**
```json
{
  "total": 42,
  "byCities": {
    "Москва": 15,
    "Санкт-Петербург": 8,
    "Новосибирск": 5
  }
}
```

**Computation:** Real-time aggregation from all registrations

---

## Response Formats

### Success Message (Registration Complete)

**Format:** Markdown

**Template:**
```markdown
✅ Отлично! Вы зарегистрированы.

Ваш город: *{city}*
Время регистрации: {formattedDate}

Добро пожаловать на мероприятие! 🎉
```

**Example:**
```markdown
✅ Отлично! Вы зарегистрированы.

Ваш город: *Москва*
Время регистрации: 14.02.2026, 12:34:56

Добро пожаловать на мероприятие! 🎉
```

---

### Error Messages

**Already Registered:**
```markdown
Вы уже зарегистрированы!

Ваш город: *Москва*
Время регистрации: 14.02.2026, 12:34:56
```

**No Access (Non-Admin):**
```
У вас нет доступа к этой команде.
```

**Search Too Short:**
```
Введите минимум 2 символа для поиска.
```

**No Search Results:**
```markdown
😞 Не найдено городов по запросу "*asdf*"

Попробуйте другой вариант или выберите из топ-15.
```

---

## Inline Keyboards

### Initial Choice Keyboard

**Buttons:**
```
┌──────────────────────────────────┐
│ 📍 Поделиться местоположением    │  → callback: use_location
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ 🏙 Выбрать город вручную         │  → callback: manual_select
└──────────────────────────────────┘
```

**Code:**
```typescript
const keyboard = new InlineKeyboard()
  .text("📍 Поделиться местоположением", CB.LOCATION)
  .row()
  .text("🏙 Выбрать город вручную", CB.MANUAL);
```

---

### Top-15 Cities Keyboard

**Layout:** 2 columns, scrollable

**Buttons:**
```
┌────────────┬────────────────────┐
│ Москва     │ Санкт-Петербург    │  → callback: city:Москва
├────────────┼────────────────────┤
│ Новосибирск│ Екатеринбург       │  → callback: city:Новосибирск
├────────────┴────────────────────┤
│ ... (13 more cities)             │
├──────────────────────────────────┤
│ 🔍 Найти другой город           │  → callback: search_city
└──────────────────────────────────┘
```

**Code:**
```typescript
const keyboard = new InlineKeyboard();
for (let i = 0; i < TOP_CITIES.length; i += 2) {
  keyboard.text(TOP_CITIES[i], CB.CITY(TOP_CITIES[i]));
  if (i + 1 < TOP_CITIES.length) {
    keyboard.text(TOP_CITIES[i + 1], CB.CITY(TOP_CITIES[i + 1]));
  }
  keyboard.row();
}
keyboard.text("🔍 Найти другой город", CB.SEARCH);
```

---

### Search Results Keyboard

**Layout:** 2 columns, max 20 results

**Buttons:**
```
┌────────────┬────────────────────┐
│ Новосибирск│ Новокузнецк        │  → callback: city:Новосибирск
├────────────┼────────────────────┤
│ Новороссийск│ Новочеркасск      │  → callback: city:Новороссийск
├────────────┴────────────────────┤
│ ← Назад к топ-15                │  → callback: back_to_cities
└──────────────────────────────────┘
```

**Code:**
```typescript
const keyboard = new InlineKeyboard();
const filtered = cities.filter(c =>
  c.toLowerCase().includes(query.toLowerCase())
).slice(0, 20);

for (let i = 0; i < filtered.length; i += 2) {
  keyboard.text(filtered[i], CB.CITY(filtered[i]));
  if (i + 1 < filtered.length) {
    keyboard.text(filtered[i + 1], CB.CITY(filtered[i + 1]));
  }
  keyboard.row();
}
keyboard.text("← Назад к топ-15", CB.BACK_TO_CITIES);
```

---

## Rate Limits

**Telegram Bot API Limits:**
- 30 messages/second to different users
- 1 message/second to same user
- 20 messages/minute to same group

**Bot Behavior:**
- No rate limiting implemented (relies on Telegram)
- Each registration = 1-2 messages (well within limits)

**Expected Load:**
- Event with 1000 attendees over 4 hours
- ~4 registrations/minute average
- Peak: ~20 registrations/minute (easily handled)

---

## Error Codes

Bot uses Telegram's standard error handling:

| Error | Cause | Handling |
|-------|-------|----------|
| `401 Unauthorized` | Invalid BOT_TOKEN | Log error, exit process |
| `403 Forbidden` | User blocked bot | Silently ignore |
| `429 Too Many Requests` | Rate limit hit | Telegram retries automatically |
| `500 Internal Server Error` | Telegram API down | Log error, retry |

**Custom Errors:**
- File I/O errors → log to console, reply with generic error to user
- Invalid callback data → answer with error, log warning

---

## Webhook Integration

**Endpoint:** `https://yourdomain.com/w/<bot_id>`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:** Telegram Update object
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {...},
    "chat": {...},
    "date": 1707912345,
    "text": "/start"
  }
}
```

**Response:**
- `200 OK` - Update processed successfully
- `400 Bad Request` - Invalid update format (shouldn't happen)
- `500 Internal Server Error` - Bot error (logged)

**Set Webhook:**
```bash
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=https://yourdomain.com/w/abc123"
```

Bot Platform handles this automatically on start.

---

## Testing API

### Manual Testing

```bash
# Simulate /start command
curl -X POST https://yourdomain.com/w/abc123/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "from": {
        "id": 123456789,
        "first_name": "Test",
        "username": "testuser"
      },
      "chat": {
        "id": 123456789,
        "type": "private"
      },
      "date": 1707912345,
      "text": "/start"
    }
  }'
```

### Unit Testing (future)

```typescript
// Example test structure
describe('Registration Flow', () => {
  it('should register new user', async () => {
    const ctx = createMockContext({ userId: 123, city: 'Москва' });
    await handleCitySelection(ctx, 'Москва');
    expect(storage.isRegistered(123)).toBe(true);
  });
});
```

---

## API Versioning

**Current Version:** 1.0.0

**Breaking Changes:**
- Adding required fields to Registration
- Changing callback data format
- Removing commands

**Non-Breaking Changes:**
- Adding optional fields to Registration
- Adding new commands
- Adding new callback handlers

**Migration Strategy:**
- Backwards compatible storage (optional fields)
- Database migration scripts for schema changes
- Deprecation warnings before removing features

---

## Future API Additions

### Multi-Event Support

```
/start event123          # Register for specific event
/events                  # List available events
/unregister              # Cancel registration
```

### User Management

```
/myinfo                  # Show registration details
/changecity              # Update city
/delete                  # Delete registration (GDPR)
```

### Advanced Admin

```
/broadcast <message>     # Send message to all registered
/ban <user_id>          # Prevent registration
/reset                   # Clear all data (with confirmation)
```

---

## References

- [grammY Documentation](https://grammy.dev)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Inline Keyboards](https://core.telegram.org/bots/features#inline-keyboards)
- [Webhook Guide](https://core.telegram.org/bots/webhooks)
