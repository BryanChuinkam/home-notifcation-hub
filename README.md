# Home Notification Hub

A self-hosted household messaging application under development for macOS and later Raspberry Pi 4. This first task establishes the workflow and development environment. It is not the authenticated messaging MVP: no database, login, device registry or adapters are implemented yet.

## Local setup

Use Node 22.23.2 (`nvm use` if available) and npm 10.9.8.

```sh
cd /Users/chui0005/Documents/projects/4fun/home-notification-hub
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The diagnostic page and `/api/health` contain no household data and require no secrets. Keep the scaffold on loopback until authentication and trusted HTTPS exist. `.env.example` documents the future database setting; it is not consumed yet.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run start
# After build; browser tests start their own server on port 3217:
npx playwright install chromium
npm run test:e2e
# Full non-browser verification with concise output:
npm run check:quiet
```

## Repository map

```text
AGENTS.md / CLAUDE.md       shared agent rules and compatibility import
HANDOFF.md                 current state and exact next action
PRODUCT.md / DESIGN.md     product requirements and architecture
EXECUTION_PLAN.md           milestones
src/app/                   minimal App Router page and health endpoint
scripts/                   quiet verification and PR routing/classification
tests/                    Vitest and desktop/mobile Playwright + axe
.github/workflows/         runner-selectable required PR gate
docs/scope.md             current bounded scope
docs/plans/               authenticated foundation and messaging plans
docs/ops/                 environments, backup/migration and hardware evidence
docs/reference/           original supplied documents, preserved verbatim
docs/archive/             historical material only
```

Read [HANDOFF.md](HANDOFF.md) for verification and next work. [Workflow](docs/agent-workflow.md) describes task→staging→main routing and explicit Local/Cloud CI selection. The GitHub remote is [BryanChuinkam/home-notifcation-hub](https://github.com/BryanChuinkam/home-notifcation-hub); see HANDOFF.md for protection and runner provisioning status. A missing CI_RUNNER never defaults to cloud. [Hardware guide](docs/ops/hardware-validation.md) lists pending receiver configuration and evidence requirements. Docker/HTTPS/pilot/Pi commands will be added with verified deployments; the current task does not provision those services.
