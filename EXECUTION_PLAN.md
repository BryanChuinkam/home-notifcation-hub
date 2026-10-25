# Delivery plan

- [x] Foundation task: new directory/repository, authoritative source snapshots, shared docs, architecture, minimal Next.js/Tailwind environment, verification commands and PR routing CI configuration.
- [x] Repository setup: bootstrap branches pushed, main/staging protections read back, automatic merged-branch deletion enabled, foundation PR #1 merged into staging, isolated local Linux ARM64 CI passed. Owner review/merge remains pending.
- [x] Milestone 1: pinned database/migrations/native compatibility; secure initial admin setup, login/logout, server authorization, authenticated shell, clearly labeled mock device seed and tests. See docs/plans/01-foundation.md.
- [ ] Milestone 2: device registry, typed mock adapter, durable dispatcher, deduplication, capability validation, multi-recipient composer, delivery records, bounded retries and history. See docs/plans/02-messaging.md.
- [ ] Milestone 3: server-only Home Assistant access, entity/service discovery, registration and manual receiver verification.
- [ ] Milestone 4: Google Home, Google TV, phones, Windows, Mac, browser; Roku fallback investigation. Record evidence per physical device.
- [ ] Milestone 5: groups/templates, mobile flow, detailed troubleshooting and accessibility.
- [ ] Milestone 6: Compose, HTTPS, persistent backups, health/readiness, isolated staging/pilot and tested ARM64 migration.

The owner selected Milestone 1 after PR #1 merged. Its implementation is complete and undergoing PR delivery; see HANDOFF.md for exact verification and merge state. Stop before Milestone 2 unless the owner selects it. Application deployment remains separate from Git/CI success.
