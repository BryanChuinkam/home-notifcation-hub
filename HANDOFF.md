# Current handoff

## Task and state

2026-10-25: completed the workflow-adoption foundation task in `/Users/chui0005/Documents/projects/4fun/home-notification-hub`. Outcome: shared project memory, architecture and release conventions plus a minimum runnable Next.js environment. The adoption document’s explicit first-task boundary takes precedence over the specification’s broader request to implement milestones 1–2 immediately.

Git setup task, 2026-10-25: owner linked `origin` to https://github.com/BryanChuinkam/home-notifcation-hub and authorized commits, pushes, protections and a PR before milestone 1. Local CI selected; isolated runner setup authorized. Local empty bootstrap commit `fcb5e57` anchors main/staging; foundation work is on `chore/project-foundation`. At the time of this commit the remote is empty; the authorized next operation is pushing these three branches, protecting main/staging, then opening the foundation PR to staging. No merge or deployment is authorized by this task. Milestone 1 remains unstarted.

Repository admin access verified. Automatic merged-task-branch deletion is enabled. Only the owner is a collaborator, so protections will require PRs, GitHub Actions' Required gate, current base, resolved conversations, and no force-push/deletion/admin bypass; independent approval count stays zero for this solo repository. CODEOWNERS assigns CI/routing changes to the owner. Protection API readback and actual CI run results must be verified after push.

Local runner `hnh-ci-ephemeral` (GitHub runner 2.338.1) was registered and confirmed online/idle with self-hosted/Linux/ARM64/hnh-ci labels. Docker inspection confirmed no mounts or published ports and bridge networking. It accepts one job and deregisters; provision anew for later operations using [local CI instructions](docs/ops/local-ci.md). No application deployment occurred.

Implemented: authoritative sources preserved verbatim under docs/reference; AGENTS.md and CLAUDE.md import; product/design/scope/milestone/ops docs; pinned npm lockfile; strict Next.js/React/TypeScript/Tailwind scaffold; loopback diagnostic page and no-store liveness route; Vitest; desktop/mobile Playwright + axe; quiet verification; PR routing, docs-only classification and runner-selectable Required gate configuration. Next dev appended its version-matched documentation advice to AGENTS.md; shared project instructions remain intact.

Not implemented: SQLite/schema/migrations, authentication, shadcn components, dashboard, device registry, dispatcher, Home Assistant adapter, groups/templates/history, Docker/HTTPS, deployment or native ARM64 validation. No devices connected, no live credentials handled, no hardware tested. The diagnostic page has no private data; household access is not enabled.

## Verification

Tested the scaffold being committed on macOS ARM64 using Node 22.23.2 and npm 10.9.8. Later login shells selected Homebrew Node 26; final install/checks explicitly prepended the pinned Node binary directory. Tested code/config/lockfile SHA-256 manifest fingerprint: `0575dc0293690a75c2fb0dac52cab21bf1d62daba6e4c1924f69b20adcd2b2d4` (relative path + NUL + bytes + NUL, sorted, covering src/scripts/tests and top-level app/test configs, package files and workflow). The fingerprint covers the earlier scaffold; this setup task adds runner tooling and CODEOWNERS without changing application behavior. The rerun results below apply to the scaffold in the foundation commit.

- `npm ci`: passed, audit reported zero vulnerabilities. ESLint 9.39.5 emits an upstream deprecation notice; pinned for Next lint plugins’ declared peer compatibility, documented in AGENTS.md.
- `npm run check:quiet` rerun for repository setup: passed: ESLint, Next route type generation + strict tsc, 14 Vitest tests, optimized production build.
- `npm run test:e2e` rerun for repository setup: 2/2 passed (desktop Chromium and mobile viewport Chromium), no horizontal overflow, keyboard link focus, health response and zero axe violations for the configured WCAG tags. This is emulation, not physical phone/Safari testing.
- Development smoke: `npm run dev -- --port 3007`, GET `/` and `/api/health` returned 200; health body identified foundation. Temporary server stopped.
- Quiet wrapper deliberately executed `exit 7` and preserved status 7 with retained full failure log.
- Workflow YAML parsed locally. CI has not yet executed on GitHub at commit time; runner registration/online state and isolation were verified, while branch protection and job execution await the initial push/PR. Impeccable mechanical scan of diagnostic page/CSS returned no findings; product visual design remains deferred.

## Exact next action

Begin the bounded [authenticated foundation plan](docs/plans/01-foundation.md) when selected by the owner. Before implementation validate pinned Drizzle/SQLite/Argon2 compatibility and follow current official docs. Build migration/persistence tests and secure single-admin setup/login/session authorization, then the mock-device shell. Stop at that plan’s acceptance boundary; messaging has its own [plan](docs/plans/02-messaging.md).

First complete the authorized setup operation: push bootstrap and foundation branches, verify protection settings, open the foundation PR targeting staging and inspect Required gate on the selected local runner. Leave the PR for owner review; do not merge or start milestone 1 automatically. Continue feature work from current staging after the foundation is merged. Any push/PR/merge/manual CI operation requires an explicit Local/Cloud selection under the reusable workflow; local implementation needs no such choice. Hardware and trusted HTTPS provisioning are later owner-coordinated steps.
