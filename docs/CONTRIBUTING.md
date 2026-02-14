# Contributing Guide

Thank you for considering contributing to Event Registration Bot! This document provides guidelines and instructions for contributing.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Submitting Changes](#submitting-changes)
7. [Feature Requests](#feature-requests)
8. [Bug Reports](#bug-reports)

---

## Code of Conduct

### Our Standards

- **Be respectful** - Treat all contributors with respect and courtesy
- **Be constructive** - Provide helpful feedback and suggestions
- **Be collaborative** - Work together to improve the project
- **Be inclusive** - Welcome contributors of all backgrounds and skill levels

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting remarks, or personal attacks
- Publishing private information without permission
- Any conduct deemed unprofessional

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Basic knowledge of TypeScript
- Familiarity with Telegram Bot API
- (Optional) Bot Platform installed for integration testing

### Setup Development Environment

1. **Fork the repository** (if external contributor)

2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/prohodka.git
   cd prohodka
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your test bot token
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Verify setup:**
   - Send `/start` to your test bot
   - Confirm registration flow works

---

## Development Workflow

### Branch Naming

Use descriptive branch names:

```bash
feature/multi-event-support
fix/stats-command-crash
docs/improve-readme
refactor/storage-layer
```

**Format:** `<type>/<description>`

**Types:**
- `feature/` - New functionality
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code restructuring without behavior change
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following [coding standards](#coding-standards)

3. **Test your changes** thoroughly

4. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add multi-event support"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** (see [Submitting Changes](#submitting-changes))

---

## Coding Standards

### TypeScript Style

**Formatting:**
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings (except when avoiding escapes)
- Trailing commas in multiline objects/arrays

**Example:**
```typescript
const keyboard = new InlineKeyboard()
  .text("Button 1", "callback_1")
  .text("Button 2", "callback_2");

const data = {
  userId: 123,
  city: 'Москва',
};
```

**Naming Conventions:**
- **Variables/Functions:** `camelCase`
  ```typescript
  const userName = 'Ivan';
  function handleCitySelection() {}
  ```

- **Classes/Interfaces:** `PascalCase`
  ```typescript
  class RegistrationStorage {}
  interface Registration {}
  ```

- **Constants:** `UPPER_SNAKE_CASE` or `camelCase` for complex objects
  ```typescript
  const MAX_SEARCH_RESULTS = 20;
  const CB = { CITY: (c) => `city:${c}` };
  ```

- **Files:** `kebab-case.ts`
  ```
  registration-storage.ts
  city-selector.ts
  ```

### Code Organization

**File Structure:**
```typescript
// 1. Imports
import { Bot } from 'grammy';
import { RegistrationStorage } from './storage';

// 2. Constants
const TOP_CITIES = [...];
const CB = {...};

// 3. Helper functions
function createKeyboard() {...}

// 4. Main export
export default function setup(bot: Bot) {...}
```

**Function Size:**
- Keep functions small (<50 lines)
- Extract complex logic to helper functions
- One responsibility per function

**Comments:**
- Explain "why", not "what"
- Use JSDoc for public APIs
- Avoid obvious comments

**Good:**
```typescript
// Limit to 20 results to prevent keyboard overflow (Telegram limit: 100 buttons)
const filtered = cities.slice(0, 20);
```

**Bad:**
```typescript
// Create a variable called filtered
const filtered = cities.slice(0, 20);
```

### TypeScript Best Practices

**Use strict types:**
```typescript
// Good
function register(userId: number, city: string): Registration {
  // ...
}

// Bad
function register(userId: any, city: any): any {
  // ...
}
```

**Avoid `any`:**
```typescript
// Good
const ctx: Context

// Bad
const ctx: any
```

**Use optional chaining:**
```typescript
// Good
const username = ctx.from?.username;

// Bad
const username = ctx.from && ctx.from.username;
```

**Prefer `const` over `let`:**
```typescript
// Good
const cities = [...];

// Bad
let cities = [...];
```

### grammY Patterns

**Always answer callbacks:**
```typescript
bot.callbackQuery("pattern", async (ctx) => {
  // ... handle callback
  await ctx.answerCallbackQuery(); // Always include!
});
```

**Use proper error handling:**
```typescript
bot.command("start", async (ctx) => {
  try {
    // ... logic
  } catch (error) {
    console.error("Error in /start:", error);
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
});
```

**Check context before use:**
```typescript
if (!ctx.from) return; // Guard against missing user data
```

---

## Testing Guidelines

### Manual Testing Checklist

Before submitting PR, test:

- [ ] `/start` - New user registration flow
- [ ] `/start` - Already registered user
- [ ] Top-15 city selection
- [ ] Text search (valid city)
- [ ] Text search (no results)
- [ ] Text search (partial match)
- [ ] `/stats` - Admin access
- [ ] `/stats` - Non-admin denial
- [ ] `/export` - CSV generation
- [ ] `/help` - Help message

### Integration Testing

Test with Bot Platform:

```bash
# 1. Create bot
curl -X POST http://localhost:3000/bots \
  -d '{"name":"test-registration","sourceType":"local","source":"./prohodka"}'

# 2. Start bot
curl -X POST http://localhost:3000/bots/{id}/start \
  -d '{"env":{"BOT_TOKEN":"..."}}'

# 3. Test webhook
curl -X POST https://domain/w/{id}/webhook -d '{...}'

# 4. Check logs
curl http://localhost:3000/bots/{id}/logs
```

### Test Data

Use these test cases:

**Cities:**
- "Москва" - Should find exact match
- "москва" - Should find (case-insensitive)
- "Новосиб" - Should find "Новосибирск"
- "asdfgh" - Should find nothing
- "Н" - Should require 2+ characters

**User IDs:**
- Valid: `123456789`
- Already registered: Test idempotency
- Admin: Match `ADMIN_USER_ID`

### Future: Automated Tests

When adding tests:

```typescript
// tests/registration.test.ts
import { describe, it, expect } from 'vitest';

describe('Registration Flow', () => {
  it('registers new user', () => {
    const storage = new RegistrationStorage();
    storage.register(123, 'Москва', { firstName: 'Ivan' });
    expect(storage.isRegistered(123)).toBe(true);
  });

  it('prevents duplicate registration', () => {
    const storage = new RegistrationStorage();
    storage.register(123, 'Москва', {});
    const result = storage.register(123, 'Казань', {});
    expect(result.city).toBe('Москва'); // Should keep original
  });
});
```

---

## Submitting Changes

### Pull Request Process

1. **Update documentation** if needed:
   - Update `README.md` for user-facing changes
   - Update `API.md` for new commands/callbacks
   - Update `AGENTS.md` for development changes
   - Update `CHANGELOG.md` with your changes

2. **Ensure code quality:**
   - Code follows style guide
   - No TypeScript errors (`npm run build`)
   - Manual testing completed

3. **Write clear PR description:**
   ```markdown
   ## Summary
   Add multi-event support to track registrations per event.

   ## Changes
   - Add `eventId` field to Registration interface
   - Update `/start` command to accept event parameter
   - Add `/events` command to list available events
   - Update storage to filter by event ID

   ## Testing
   - Tested `/start event123` deep link
   - Verified `/events` command shows event list
   - Checked stats are isolated per event

   ## Breaking Changes
   - Registration schema changed (migration needed)
   - Existing registrations default to `eventId: "default"`
   ```

4. **Link related issues:**
   ```markdown
   Closes #42
   Related to #38
   ```

5. **Wait for review** - Be patient and responsive to feedback

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

**Examples:**
```
feat(search): add fuzzy matching for city names

Implements Levenshtein distance algorithm to find cities
with typos (e.g., "Maskva" → "Москва").

Closes #15
```

```
fix(stats): prevent crash on empty registrations

Check if registrations array is empty before aggregating.

Fixes #23
```

```
docs(api): document webhook integration

Add section on webhook setup and testing.
```

### Review Process

1. **Automated checks** (if configured):
   - TypeScript compilation
   - Linting
   - Tests (when added)

2. **Manual review:**
   - Code quality
   - Architecture fit
   - Security considerations
   - Performance impact

3. **Requested changes:**
   - Address feedback promptly
   - Push new commits to same branch
   - Re-request review when ready

4. **Approval & merge:**
   - Maintainer approves PR
   - Squash and merge (usually)
   - Branch auto-deleted

---

## Feature Requests

### Before Requesting

- **Check existing issues** - Feature may already be proposed
- **Consider scope** - Does it fit the project's purpose?
- **Evaluate complexity** - Is it worth the maintenance burden?

### How to Request

1. **Open an issue** with template:
   ```markdown
   ## Feature Description
   Add support for multiple events per bot instance.

   ## Use Case
   Event organizer hosts multiple events and wants one bot
   to handle registrations for all of them.

   ## Proposed Solution
   - Add `eventId` parameter to /start deep link
   - Store `eventId` in Registration model
   - Filter stats/export by event

   ## Alternatives Considered
   - Deploy separate bot per event (too complex)
   - Use different bot accounts (user confusion)

   ## Implementation Complexity
   Medium - requires schema migration and UI updates.
   ```

2. **Discuss with maintainers** - Get feedback on approach

3. **Wait for approval** - Don't start coding until confirmed

4. **Implement if approved** - Follow development workflow

---

## Bug Reports

### Before Reporting

- **Check existing issues** - Bug may already be reported
- **Verify it's a bug** - Not a configuration issue
- **Try latest version** - May already be fixed

### How to Report

1. **Open an issue** with template:
   ```markdown
   ## Bug Description
   `/stats` command crashes when no registrations exist.

   ## Steps to Reproduce
   1. Start bot with clean data directory
   2. Send `/stats` command as admin
   3. Bot returns error message

   ## Expected Behavior
   Should show "No registrations yet" message.

   ## Actual Behavior
   TypeError: Cannot read property 'length' of undefined

   ## Environment
   - Bot version: 1.0.0
   - Node.js: 18.16.0
   - Deployment: Bot Platform (Docker Swarm)
   - OS: Ubuntu 22.04

   ## Logs
   ```
   [ERROR] TypeError at storage.ts:67
   Cannot read property 'length' of undefined
   ```

   ## Additional Context
   Happens only on fresh install before first registration.
   ```

2. **Attach logs** if relevant

3. **Include screenshots** for UI issues

4. **Wait for triage** - Maintainer will confirm and prioritize

### Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
- Email maintainer directly (if contact provided)
- Use GitHub Security Advisory (if available)
- Wait for fix before public disclosure

---

## Development Tips

### Hot Reload

Use `ts-node-dev` for auto-restart:
```bash
npm run dev
# Edit files, bot restarts automatically
```

### Debugging

Add debug logs:
```typescript
if (process.env.DEBUG === 'true') {
  console.log('[DEBUG] City selected:', city);
}
```

### Testing Callbacks

Use Telegram's [Bot API documentation](https://core.telegram.org/bots/api#callbackquery) to understand callback structure.

### Database Migration (future)

When adding DB support:
```typescript
// migrations/001_initial.sql
CREATE TABLE registrations (
  user_id INTEGER PRIMARY KEY,
  city TEXT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [grammY Documentation](https://grammy.dev)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Bot Platform Repo](../../bot-platform/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Questions?

- Open a discussion in GitHub Discussions (if enabled)
- Ask in PR/issue comments
- Check existing documentation files

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

---

Thank you for contributing! 🎉
