# Contributing Guide

[Russian version](./CONTRIBUTING.ru.md)

## Setup

```bash
git clone https://github.com/NikoVonLas/tg-registrar-bot.git
cd tg-registrar-bot
npm install
cp .env.example .env
# Edit .env with test bot token
npm run dev
```

## Branch Naming

Format: `<type>/<description>`

Types: `feature`, `fix`, `docs`, `refactor`, `test`, `chore`

Examples: `feature/multi-event`, `fix/stats-crash`, `docs/readme`

## Code Style

- 2 spaces indentation
- Semicolons required
- Single quotes for strings
- Prefer `const` over `let`
- Use optional chaining: `ctx.from?.username`
- Always call `await ctx.answerCallbackQuery()` in handlers

## Testing

Manual checklist:
- `/start` - new user + already registered
- City selection (top-15, search)
- `/stats`, `/export` - admin only

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(search): add fuzzy matching
fix(stats): prevent crash on empty data
docs(api): document webhook integration
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull Requests

1. Update relevant documentation
2. Ensure code compiles: `npm run build`
3. Write clear PR description
4. Link related issues

## Feature Requests

1. Check existing issues first
2. Open issue with description, use case, proposed solution
3. Wait for approval before implementing

## Bug Reports

Include:
- Description
- Steps to reproduce
- Expected vs actual behavior
- Environment (version, Node.js version, OS)
- Logs if relevant

For security issues, contact maintainer directly (do not open public issue).

## License

Contributions licensed under MIT License.
