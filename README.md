# Home Notification Hub

A self-hosted household messaging application for macOS and, later, Raspberry Pi 4. Milestones 1–3 provide secure single-administrator access, persistent SQLite storage, mock-device management, a message composer, durable dispatch/retries and per-device delivery history. Home Assistant discovery/registration, notify/TTS dispatch and separate manual test evidence are implemented. Mock sends remain simulated; hardware compatibility must be verified after you configure HA.

Home Assistant installation, onboarding, token creation and speaker/TV setup are covered in the [Home Assistant setup guide](docs/ops/home-assistant.md). `npm run setup:secret` creates only the Hub setup secret; create the HA access token in Home Assistant.

Milestone 4 receiver profiles and platform-specific prerequisites are in the [real receiver guide](docs/ops/real-devices.md). Google Broadcast, Android TV appearance and browser push require explicit server profiles and configured HA integrations; hardware validation remains separate.

## Start and stop

Use [Start everything / stop everything](docs/ops/daily-operations.md) for the daily startup/shutdown order, Hub+worker commands, Home Assistant VM controls, restarts and status checks. It is the canonical service-operations guide for this Mac setup. After initial configuration, `npm run start:all` starts the UTM/HA guest and Hub+worker; `npm run stop:all` gracefully stops the managed stack. See the guide for the one-time transition from manually started services and Automation permissions.

For a fresh installation, follow [administrator setup](docs/ops/administrator-setup.md#first-installation). Existing installations keep .env.local and persistent data; setup secrets/accounts are not recreated for a normal restart. Node 22.23.2 and npm 10.9.8 are pinned in this repository.

## Verify the application

```sh
npm run lint
npm run typecheck
npm test
npm run build
# Build before browser tests; one isolated temporary database per browser project:
npx playwright install chromium
npm run test:e2e
npm run check:quiet
```

Keep development on loopback. Household access from other devices requires a configured HTTPS origin and trusted reverse proxy in the later deployment milestone. HTTP LAN origins are rejected. `/api/health` is public process liveness; `/api/devices` requires an authenticated session. Mock devices never contact physical receivers. Registered Home Assistant targets can make real calls after explicit setup and send actions. API success is not physical receiver verification.

## Try mock messaging

Start the Hub using the [daily guide](docs/ops/daily-operations.md#start-everything). It starts both web and worker; Home Assistant is optional for mock-only use.

1. Sign in and open Devices to add/edit mock devices, choose capabilities and select a simulated receiver response.
2. On Overview, choose text/speech/overlay, select compatible recipients, enter a message and review it before sending.
3. Inspect each device's result and attempts in History. Temporary mock failures retry automatically; permanent rejection fails without retry. Resend creates a new message after revalidating the original recipients.
4. Test mock devices from Devices. A simulated test never updates physical test evidence or proves display/speech.

The worker continues independently of the browser. See [daily operations](docs/ops/daily-operations.md#optional-services-and-data) for standalone-worker controls and [messaging operations](docs/ops/messaging.md) for queue semantics and limitations.

## Configure Home Assistant after first setup

The Hub can run with HA variables blank. To use real targets, install/configure a reachable Home Assistant instance separately, set HOME_ASSISTANT_URL, the pinned HOME_ASSISTANT_ADDRESS and HOME_ASSISTANT_TOKEN only on the server, then restart. Open Settings to discover/register supported targets and Devices to explicitly send a test. Confirm physical output separately in its delivery details.

Follow [the complete Home Assistant guide](docs/ops/home-assistant.md) for macOS hosting/networking, token setup, allowed addresses/ports, TTS limitations and manual verification. Daily service controls live in the consolidated operations guide. The Hub does not install Home Assistant automatically. Keep tokens out of browser fields and chat.

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
