# Current handoff

## Current task and Git state

2026-10-25: owner confirmed PR #1 merged and requested rebase/continue. Foundation branch was rebased onto origin/staging; local staging fast-forwarded to `82f1c6d2f5ed1ad117b704f24e5673be99cd5e1f`. The merged local foundation branch was removed after ancestry verification. Active branch: `feat/authenticated-foundation`, based on that staging revision.

Milestone 1 (authenticated foundation) is implemented and verified locally. Its feature branch/PR is the delivery record; consult GitHub for the current head, CI and merge state. Owner explicitly selected Local for that push and accompanying PR; a fresh isolated `hnh-ci-ephemeral` runner was provisioned and confirmed online/idle. Set/read back CI_RUNNER and confirm availability again immediately before pushing. No feature changes are merged yet. Main remains production history at the empty bootstrap. No application deployment, trusted HTTPS or hardware validation has occurred.

## Implemented

- SQLite/Drizzle schema and immutable SQL migration for one admin, hashed sessions, persistent attempt budgets and mock devices. Foreign keys, WAL, 5-second busy timeout, restricted file modes, transactionally applied migrations and applied-file hash verification. Explicit repeatable `npm run db:migrate`; no destructive reset/schema-push command.
- Operator-secret initial setup with Zod validation, Argon2id hashing (19 MiB/two passes/one lane), singleton check inside an immediate transaction and three deterministic sample devices created atomically. No default password. Remove setup secret and restart after creating the admin; setup remains closed.
- Login/logout and eight-hour server sessions: 256-bit random tokens, SHA-256 digests in storage, HttpOnly/SameSite=Strict cookies, Secure for HTTPS origins, expiry and logout revocation. Persistent global limits: 10 logins/five setup attempts per 15 minutes.
- Exact configured-Origin checks and cross-site-fetch rejection on mutations, bounded JSON bodies, generic errors and no-store protected API responses. All dashboard/device operations require server authorization; public health is liveness only.
- Responsive authenticated shell with owned shadcn-style controls, real icons, setup/login feedback, and stored mock devices showing capabilities and “Not tested”. No online/device-delivery claims or messaging controls.
- Setup/configuration documentation, per-project isolated E2E servers/databases, updated plan/scope/agent instructions.

## Verification

Tested source/config/lockfile manifest SHA-256: `445cf5d0cb66c8f97b0c63aa3d5e71fec2acdd4d1e0e39ae4ae5dc57a52bd65e` (sorted relative path + NUL + bytes + NUL; src/scripts/tests/migrations plus top-level app/test/config files, package files and components.json). The feature commit containing this handoff captures that content; its eventual PR records the exact tested Git head and CI result.

- Node 22.23.2/npm 10.9.8 on macOS ARM64: `npm run check:quiet` passed lint, Next route generation/strict tsc, **31 tests** and production build. Tests exercise actual SQLite files/reopening, migration integrity and CLI repetition, competing setup connections, password verification, session rotation/expiry/logout, persistent throttles, origin/JSON guards and protected reads.
- `npm run test:e2e`: **2/2 passed** (desktop Chromium/mobile Chromium emulation), covering setup→failed/successful login→mock dashboard→reload→logout and unauthenticated redirects/API rejection. Axe checks on setup/login/dashboard found zero violations for configured WCAG tags; dashboard had no horizontal overflow. Desktop/mobile screenshots were inspected in one batch. The UI detector's system-font warning is accepted for Operate mode.
- Isolated Linux ARM64 Docker check: clean npm install, native Argon2/SQLite tests (30 at that earlier checkpoint) and production build passed. Container had no host mounts, credentials or published ports and was removed after exit 0. Latest complete Linux/browser evidence will come from the feature PR's Required gate.
- Native macOS smoke confirmed SQLite 3.53.4 and Argon2id hash/verify. npm audit reported zero vulnerabilities. ESLint's upstream deprecation notice remains documented; Next lint plugins still declare the retained compatible peer range.

The migration CLI smoke caught a CommonJS named-import mismatch, fixed before final verification and covered by its new regression test. No test or smoke operation created a live administrator or touched a household database. Browser processes use unique owned temporary storage and loopback 3217/3218; CI uses mocks only.

## Next action and limits

The authorized Local push/PR delivery must verify Required gate for its exact head, then leave the PR open for owner review. Review that PR and its current checks before the next implementation task. Do not merge or begin Milestone 2 automatically. On the next selected task, follow [messaging plan](docs/plans/02-messaging.md) from updated staging after this feature merges.

Operator local setup: follow README.md, create ignored .env.local, generate/set HUB_SETUP_SECRET, migrate, run the loopback app and create your administrator. No live secrets were provisioned by this task. Intel Mac, physical Pi, Safari/physical phone, trusted HTTPS, backup/restore and all real device delivery remain unverified. Global throttling can temporarily block all sign-in attempts if another client exhausts the shared budget; password recovery/change and session management UI are deferred. App Compose/HTTPS and Home Assistant/notifications remain later milestones.
