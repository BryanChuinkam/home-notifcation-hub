# Home Notification Hub

A self-hosted household messaging application for macOS and, later, Raspberry Pi 4. Milestones 1–3 provide secure single-administrator access, persistent SQLite storage, mock-device management, a message composer, durable dispatch/retries and per-device delivery history. Home Assistant discovery/registration, notify/TTS dispatch and separate manual test evidence are implemented. Mock sends remain simulated; hardware compatibility must be verified after you configure HA.

Home Assistant installation, onboarding, token creation and speaker/TV setup are covered in the [Home Assistant setup guide](docs/ops/home-assistant.md). `npm run setup:secret` creates only the Hub setup secret; create the HA access token in Home Assistant.

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

SQLite data lives under ignored `data/development/` and survives rebuilding the app. The app launcher applies migrations before starting the web server and queue worker; the explicit migration command is also available. Applied migration files are checked for changes and must remain immutable. There is no production reset command. See [local setup and security](docs/ops/administrator-setup.md).

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

Keep development on loopback. Household access from other devices requires a configured HTTPS origin and trusted reverse proxy in the later deployment milestone. HTTP LAN origins are rejected. `/api/health` is public process liveness; `/api/devices` requires an authenticated session. Mock devices never contact physical receivers. Registered Home Assistant targets can make real calls after explicit setup and send actions. API success is not physical receiver verification.

## Try mock messaging

Stop any server started before Milestone 2, run `npm ci`, then restart with `npm run dev` (or build and `npm run start`). These commands now start both the Next.js server and a background queue worker. Existing credentials, sessions and devices survive the additive migration. Keep your existing .env.local; do not copy the example over it.

1. Sign in and open Devices to add/edit mock devices, choose capabilities and select a simulated receiver response.
2. On Overview, choose text/speech/overlay, select compatible recipients, enter a message and review it before sending.
3. Inspect each device's result and attempts in History. Temporary mock failures retry automatically; permanent rejection fails without retry. Resend creates a new message after revalidating the original recipients.
4. Test mock devices from Devices. A simulated test never updates physical test evidence or proves display/speech.

The worker continues independently of the browser. `npm run worker:once` processes one batch of up to 20 currently due deliveries; `npm run worker` starts a standalone worker for troubleshooting. Normal app commands already run a worker. Restart the launcher after changing worker/domain code or environment settings; Next.js still hot-reloads frontend changes. See [messaging operations](docs/ops/messaging.md) for queue semantics and limitations.

## Configure Home Assistant after first setup

The Hub can run with HA variables blank. To use real targets, install/configure a reachable Home Assistant instance separately, set HOME_ASSISTANT_URL, the pinned HOME_ASSISTANT_ADDRESS and HOME_ASSISTANT_TOKEN only on the server, then restart. Open Settings to discover/register supported targets and Devices to explicitly send a test. Confirm physical output separately in its delivery details.

Follow [the complete Home Assistant guide](docs/ops/home-assistant.md), including first-run commands, macOS hosting/networking choices, token setup, allowed addresses/ports, TTS limitations and manual verification. These commands do not install Home Assistant automatically. Keep tokens out of browser fields and chat.

## Repository map

```text
AGENTS.md / CLAUDE.md       shared agent rules and compatibility import
HANDOFF.md                 current state, verification and exact next action
PRODUCT.md / DESIGN.md     requirements, architecture and UI conventions
EXECUTION_PLAN.md           milestone progress
src/app/                   setup/login, composer, devices, history and APIs
src/components/ui/         owned shadcn-style Button/Input primitives
src/server/auth/           credentials, sessions, throttling and HTTP guards
src/server/db/             typed Drizzle schema and SQLite connection/migrations
src/server/notifications/  typed adapters, persistent queue and protected APIs
src/server/home-assistant/ pinned transport, discovery, registration and dispatch
migrations/                immutable reviewed SQL and Drizzle journal
scripts/                   migration, isolated E2E/CI and verification tools
tests/                     persistence/auth tests and desktop/mobile E2E
.github/                   CODEOWNERS and required PR verification
docs/                      scope, implementation plans, operations and references
```

[PR #1](https://github.com/BryanChuinkam/home-notifcation-hub/pull/1) established the workflow and is merged into staging. See [HANDOFF.md](HANDOFF.md) for current branch and delivery evidence. [Workflow](docs/agent-workflow.md) describes task→staging→main routing and explicit Local/Cloud selection before remote operations. The [local CI guide](docs/ops/local-ci.md) provisions a disposable runner with no household credentials or host mounts. [Hardware validation](docs/ops/hardware-validation.md) tracks pending real receiver setup. Application Compose, HTTPS, backup/restore and Pi deployment remain planned work.
