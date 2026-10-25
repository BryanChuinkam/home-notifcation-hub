# First implementation milestone: authenticated foundation

Outcome: a local single-admin application persists data and displays labeled mock devices behind authentication.

Scope: src/server/auth, src/server/db, migrations, initial setup/login/logout routes and pages, authenticated dashboard shell, mock seed, tests, env examples and ops docs. Adopt shadcn components only as needed. Validate chosen Drizzle/SQLite/Argon2 versions and native platform support before installation.

Acceptance:
- A fresh DB migrates and persists across restarts; reset touches only an explicit development/test path.
- Setup requires an operator-provided one-time secret, creates exactly one admin even under concurrent requests; no hardcoded credentials.
- Argon2id hashing and verification, secure opaque sessions, expiry/logout, throttling, same-origin/CSRF enforcement and protected pages/APIs have negative tests.
- Initial shell shows mock device capabilities and unknown communication state, not online claims.
- Lint, strict types, unit/integration/build and desktop/mobile Playwright/axe journeys pass; native macOS and ARM64 verification limitations are recorded.

Stopping point: authenticated shell and mock fixture display; no messaging implementation. Update handoff and plan. A new task must select milestone 2.

Selected 2026-10-25 after PR #1 merged. Branch: feat/authenticated-foundation; base: staging 82f1c6d. Local tests exercise real temporary SQLite files and native Argon2, with separate browser databases. Hand-reviewed SQL plus Drizzle migrations were selected to avoid adding a generator/runtime service; applied migration hashes are checked. Native platform evidence and final acceptance are recorded in HANDOFF.md.

Implementation acceptance: 31 unit/security/persistence/routing tests and two complete desktop/mobile setup→login→dashboard→logout journeys pass, with axe checks on setup/login/dashboard. Native packages and build also pass in isolated Linux ARM64. Application deployment, Intel and physical Pi are unverified. Stop before Milestone 2. See HANDOFF.md and the feature PR for current-head CI results.
