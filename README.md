# Home Notification Hub

A self-hosted household messaging application for macOS and, later, Raspberry Pi 4. Milestone 1 provides secure single-administrator setup/login, persistent SQLite storage and a responsive dashboard with three clearly labeled mock devices. Messaging and real device integrations are not implemented yet.

## Run locally

Use Node 22.23.2 and npm 10.9.8. Native SQLite and Argon2 packages are required; use `nvm use` before installing or running commands.

```sh
cd /Users/chui0005/Documents/projects/4fun/home-notification-hub
nvm use
npm ci
cp .env.example .env.local
npm run setup:secret
```

Put the generated secret into `HUB_SETUP_SECRET` in `.env.local`. Keep `APP_ORIGIN=http://127.0.0.1:3000` for the default loopback server. No default administrator credentials exist.

```sh
npm run db:migrate
npm run dev
```

Open http://127.0.0.1:3000. Create an administrator using the setup secret, a 3–32 character username and a 12–128 character password; then sign in. Setup atomically creates the sole administrator and three sample devices. Once complete, remove HUB_SETUP_SECRET from `.env.local` and restart; setup remains closed because the administrator exists in SQLite. Sessions survive restarts and expire after eight hours; Sign out revokes the current session.

SQLite data lives under ignored `data/development/` and survives rebuilding the app. Migrations run on first database access and through the explicit migration command. Applied migration files are checked for changes and must remain immutable. There is no production reset command. See [local setup and security](docs/ops/administrator-setup.md).

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run start
# Build before browser tests; one isolated temporary database per browser project:
npx playwright install chromium
npm run test:e2e
npm run check:quiet
```

Keep development on loopback. Household access from other devices requires a configured HTTPS origin and trusted reverse proxy in the later deployment milestone. HTTP LAN origins are rejected. `/api/health` is public process liveness; `/api/devices` requires an authenticated session. No mock device represents a verified physical receiver, and no notification is sent.

## Repository map

```text
AGENTS.md / CLAUDE.md       shared agent rules and compatibility import
HANDOFF.md                 current state, verification and exact next action
PRODUCT.md / DESIGN.md     requirements, architecture and UI conventions
EXECUTION_PLAN.md           milestone progress
src/app/                   setup/login/dashboard and API route handlers
src/components/ui/         owned shadcn-style Button/Input primitives
src/server/auth/           credentials, sessions, throttling and HTTP guards
src/server/db/             typed Drizzle schema and SQLite connection/migrations
migrations/                immutable reviewed SQL and Drizzle journal
scripts/                   migration, isolated E2E/CI and verification tools
tests/                     persistence/auth tests and desktop/mobile E2E
.github/                   CODEOWNERS and required PR verification
docs/                      scope, implementation plans, operations and references
```

[PR #1](https://github.com/BryanChuinkam/home-notifcation-hub/pull/1) established the workflow and is merged into staging. See [HANDOFF.md](HANDOFF.md) for current branch and delivery evidence. [Workflow](docs/agent-workflow.md) describes task→staging→main routing and explicit Local/Cloud selection before remote operations. The [local CI guide](docs/ops/local-ci.md) provisions a disposable runner with no household credentials or host mounts. [Hardware validation](docs/ops/hardware-validation.md) tracks pending real receiver setup. Application Compose, HTTPS, backup/restore and Pi deployment remain planned work.
