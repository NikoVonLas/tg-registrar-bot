# Contributing Guide

Thank you for considering contributing!

[🇷🇺 Русская версия](./CONTRIBUTING.md)

## Code of Conduct

- Be respectful and constructive
- Welcome contributors of all backgrounds
- No harassment or discrimination

## Getting Started

### Setup

```bash
git clone https://github.com/NikoVonLas/tg-registrar-bot.git
cd tg-registrar-bot
npm install
cp .env.example .env
# Edit .env with test bot token
npm run dev
```

### Branch Naming

Format: `<type>/<description>`

Types: `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`

Examples:
- `feature/multi-event-support`
- `fix/stats-crash`
- `docs/improve-readme`

## Coding Standards

### TypeScript Style

- 2 spaces indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in multiline

### Naming

- Variables/Functions: `camelCase`
- Classes/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

### Best Practices

- Use strict types, avoid `any`
- Prefer `const` over `let`
- Use optional chaining: `ctx.from?.username`
- Always call `await ctx.answerCallbackQuery()` in callback handlers

## Testing

### Manual Checklist

- [ ] `/start` - New user
- [ ] `/start` - Already registered
- [ ] City selection
- [ ] Text search
- [ ] `/stats` - Admin
- [ ] `/export` - CSV

## Submitting Changes

### Pull Request

1. Update documentation if needed
2. Ensure code compiles: `npm run build`
3. Write clear PR description
4. Link related issues

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(search): add fuzzy matching
fix(stats): prevent crash on empty data
docs(api): document webhook integration
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Feature Requests

1. Check existing issues first
2. Open issue with template:
   - Feature description
   - Use case
   - Proposed solution
   - Alternatives considered
3. Wait for approval before implementing

## Bug Reports

1. Check existing issues
2. Open issue with:
   - Description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (version, Node.js, OS)
   - Logs (if relevant)

### Security Issues

Do NOT open public issues for security vulnerabilities. Email maintainer directly.

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [grammY Documentation](https://grammy.dev)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Conventional Commits](https://www.conventionalcommits.org/)

## License

By contributing, you agree that your contributions will be licensed under MIT License.

Thank you! 
