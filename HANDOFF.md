# Current handoff

## Current task and repository state

2026-10-25: establish commits, remote branches, protections and a reviewed foundation PR before Milestone 1. The application remains the minimum development scaffold; authentication and messaging have not started.

Remote: https://github.com/BryanChuinkam/home-notifcation-hub. Branch: `chore/project-foundation`, based on `staging` at empty bootstrap commit `fcb5e57`. Foundation implementation commit: `b93b8fab8a2d0ce86576a9824ea7d3fa8f0f9e67`. `main` and `staging` both contain only the bootstrap; all foundation files are in [PR #1](https://github.com/BryanChuinkam/home-notifcation-hub/pull/1), targeting staging. No PR has been merged. No application has been deployed and no hardware integration has been tested. This follow-up handoff/plan/workflow documentation is being committed separately after setup verification.

Owner selected Local CI and authorized an isolated Docker runner. `CI_RUNNER=local` was set and read back before the initial push/PR. The runner accepted one job, completed successfully and exited; it must be reprovisioned for a subsequent Local run. See [local CI instructions](docs/ops/local-ci.md). No host mounts, Docker socket, published ports or household credentials were present. Native host development services were not changed.

## Implemented and verified controls

- Both main/staging protection APIs were read back: PR required, GitHub Actions app 15368 `Required gate`, up-to-date base, resolved conversations, enforcement for admins, force-push blocked and deletion blocked.
- Only the owner is a collaborator. Required independent approval count is zero so solo work is not deadlocked; explicit owner review remains part of the workflow. CODEOWNERS assigns workflow/routing files to the owner.
- Repository automatic deletion of merged task branches is enabled; protected main/staging cannot be deleted by it. Default branch is main.
- Source routing accepts task branches into staging and only same-repository staging into main. CI performs the check on every covered PR. Nothing was force-pushed or merged.

Implemented application foundation: shared AGENTS/CLAUDE instructions, verbatim source specifications, architecture/scope/milestone/operations documents, npm lockfile, strict Next.js/React/TypeScript/Tailwind scaffold, loopback diagnostic page, no-store liveness endpoint, Vitest, desktop/mobile Playwright and axe, quiet verification, and runner-selectable PR CI. Health reports process liveness, not device availability.

Not implemented: SQLite/schema/migrations, authentication, shadcn components, dashboard/device CRUD, dispatcher/adapters, groups/templates/history, application Compose/HTTPS or pilot/Pi deployment. All hardware delivery remains unverified. Keep the diagnostic app on loopback.

## Verification evidence

On macOS ARM64 with Node 22.23.2/npm 10.9.8, before the foundation commit: `npm run check:quiet` passed (lint, Next type generation/strict tsc, 14 Vitest tests, optimized build); `npm run test:e2e` passed 2/2 desktop/mobile Chromium tests with no overflow, keyboard focus verification, healthy liveness response and zero axe violations for configured WCAG tags. This is browser emulation, not physical phone/Safari testing. Authored docs links and staged whitespace checks passed.

[GitHub run 40190629402](https://github.com/BryanChuinkam/home-notifcation-hub/actions/runs/40190629402) passed for `b93b8fab8a2d0ce86576a9824ea7d3fa8f0f9e67`. Jobs API confirmed `runner_name=hnh-ci-ephemeral` and `self-hosted,hnh-ci` labels. Linux ARM64 CI passed routing, classification, whitespace, clean npm install, full check suite and both browser tests. PR was OPEN/MERGEABLE with Required gate SUCCESS after the run. Container exited 0 and deregistered after the job. No cloud runner was used.

Earlier development smoke verified GET `/` and `/api/health` at loopback port 3007; the temporary server was stopped. Quiet-wrapper failure probe preserved exit 7 and retained its log. ESLint 9.39.5 emits its upstream deprecation notice; it is pinned for the declared peer ranges of the Next lint plugins. Native SQLite/Argon2 compatibility is still untested because those packages are not yet installed.

## Exact next action

Review PR #1 and its Required gate for the current head. The owner selected Local again for the follow-up documentation push; the setup task must verify that new run and leave the PR open. Do not merge or begin Milestone 1 as part of repository setup.

After the owner approves and requests the merge, obtain a fresh Local/Cloud choice for that operation, ensure runner availability, merge the foundation into staging and verify its state. Then branch from updated staging for the [authenticated foundation plan](docs/plans/01-foundation.md): validate SQLite/Drizzle/Argon2 compatibility; implement migrations/persistence, secure initial admin setup, login/session authorization and a mock-device shell. Messaging remains a separate [Milestone 2 plan](docs/plans/02-messaging.md). Hardware/HTTPS provisioning requires later owner coordination.
