# Delivery plan

- [x] Foundation task: new directory/repository, authoritative source snapshots, shared docs, architecture, minimal Next.js/Tailwind environment, verification commands and PR routing CI configuration.
- [x] Repository setup: bootstrap branches pushed, main/staging protections read back, automatic merged-branch deletion enabled, foundation PR #1 merged into staging, isolated local Linux ARM64 CI passed. Milestones 1–2 use the same protected routing; see HANDOFF.md for current merge state.
- [x] Milestone 1: pinned database/migrations/native compatibility; secure initial admin setup, login/logout, server authorization, authenticated shell, clearly labeled mock device seed and tests. See docs/plans/01-foundation.md.
- [x] Milestone 2: device registry, typed mock adapter, durable dispatcher, deduplication, capability validation, multi-recipient composer, delivery records, bounded retries and history. See docs/plans/02-messaging.md.
- [x] Milestone 3: server-only Home Assistant access, entity/service discovery, registration and manual receiver verification.
- [ ] Milestone 4: Google Home, Google TV, phones, Windows, Mac, browser; Roku fallback investigation. Record evidence per physical device.
- [ ] Milestone 5: groups/templates, mobile flow, detailed troubleshooting and accessibility.
- [ ] Milestone 6: Compose, HTTPS, persistent backups, health/readiness, isolated staging/pilot and tested ARM64 migration.

Milestones 1–2 are merged into staging/main. Milestone 3 implementation and fixture-based verification are complete for PR delivery; actual Home Assistant configuration and hardware verification remain operator actions. See HANDOFF.md for exact evidence and merge state. Stop before Milestone 4 unless selected. Deployment remains separate from Git/CI success.
