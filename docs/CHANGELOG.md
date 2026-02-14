# Changelog

All notable changes to Event Registration Bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Geocoding API integration for automatic city detection
- Multi-event support via deep link parameters
- PostgreSQL storage adapter for large-scale events
- Real-time dashboard for event monitoring
- Automated tests (unit + integration)

---

## [1.0.0] - 2026-02-14

### Added
- Initial release of Event Registration Bot
- QR-code-based registration flow via `/start` command
- Three city selection methods:
  - Geolocation button (prepared for future geocoding)
  - Top-15 popular cities with inline keyboard
  - Text search across 160+ Russian cities
- Registration persistence to JSON file
- Admin commands:
  - `/stats` - View registration statistics by city
  - `/export` - Download CSV with all registration data
- User commands:
  - `/start` - Begin registration or view existing registration
  - `/help` - Show available commands
- Inline keyboard navigation:
  - Two-column city buttons for mobile-friendly UX
  - Search results with up to 20 matches
  - Back navigation to top-15 list
- Data storage:
  - JSON-based persistence in `data/registrations.json`
  - Stores user ID, username, first/last name, city, timestamp
  - In-memory caching for fast lookups
- Bot Platform integration:
  - Webhook mode support
  - Environment variable configuration
  - Docker container compatibility
- Documentation:
  - README.md - User guide and quick start
  - AGENTS.md - Developer guidelines
  - ARCHITECTURE.md - System design and patterns
  - API.md - Complete command and callback reference
  - DEPLOYMENT.md - Deployment instructions
  - CONTRIBUTING.md - Contribution guide
  - CHANGELOG.md - Version history

### Technical Details
- **Framework:** grammY 1.23.0
- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.3.3
- **Storage:** JSON file (migrations to SQLite/Postgres planned)
- **Deployment:** Standalone or via Bot Platform (Docker Swarm)

### Known Limitations
- Geolocation feature prepared but not fully implemented (requires geocoding API)
- JSON storage suitable for <10k registrations (DB migration recommended for larger events)
- Single event per bot instance (multi-event support planned)
- No automated tests yet (manual testing only)
- Russian cities only (can be extended by editing cities.json)

### Security
- Admin commands protected by `ADMIN_USER_ID` environment variable
- No sensitive data stored (only public Telegram profile info)
- Webhook mode with HTTPS required in production
- Bot token never logged or exposed

---

## Version History Summary

- **1.0.0** (2026-02-14) - Initial release with core registration features

---

## Upgrade Guide

### From Development to 1.0.0

No upgrade needed - this is the first release.

---

## Future Roadmap

### Version 1.1.0 (Planned)
- [ ] Geocoding integration (Nominatim/Dadata)
- [ ] Improved error messages with recovery suggestions
- [ ] Rate limiting for search queries
- [ ] Admin notification on registration milestones (100, 500, 1000 users)

### Version 1.2.0 (Planned)
- [ ] Multi-event support via deep link parameters
- [ ] Event management commands (`/events`, `/newevent`, `/endevent`)
- [ ] Per-event statistics and exports
- [ ] Event-specific QR codes

### Version 2.0.0 (Planned)
- [ ] PostgreSQL storage adapter (breaking change)
- [ ] Database migrations system
- [ ] Horizontal scaling support
- [ ] Real-time WebSocket dashboard
- [ ] Advanced analytics (time-series, heatmaps)

---

## Breaking Changes Policy

**Major versions (X.0.0):**
- Breaking changes to data format (requires migration)
- Removal of commands or features
- Changed callback data formats
- Incompatible API changes

**Minor versions (1.X.0):**
- New features (backwards compatible)
- New commands or callback handlers
- Optional new fields in data structures
- Performance improvements

**Patch versions (1.0.X):**
- Bug fixes
- Documentation updates
- Dependency updates (security)
- Minor UX improvements

### Migration Support

When breaking changes occur:
1. Migration guide provided in this file
2. Migration scripts included (for data format changes)
3. Deprecation warnings in previous minor version
4. At least 1 month notice before removal

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on proposing changes and submitting pull requests.

---

## Support

- **Documentation:** See README.md and other docs/
- **Issues:** Report bugs via GitHub Issues
- **Discussions:** Ask questions in GitHub Discussions (if enabled)

---

## License

MIT License - See LICENSE file for details
