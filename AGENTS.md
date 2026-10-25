# Shared project instructions

Read HANDOFF.md once at startup, inspect branch and working tree, then load only relevant plans. The active request defines the task; unchecked milestones do not authorize unrelated work.

## Authority and bounded work

The supplied [reusable workflow](docs/reference/reusable-project-workflow.txt) and [project adaptation](docs/reference/workflow-adoption.md) govern project management. The [implementation specification](docs/reference/implementation-specification.md) defines the product. The adaptation explicitly narrows the first task to documentation and minimum scaffolding; do not implement the whole product in this task.

Before substantive changes record outcome, scope, acceptance and stopping point. Complete the selected scope, verify, update HANDOFF.md and the plan, then stop. Prefer one agent. Do not rewrite or repeatedly load the full reference documents.

## Stack and boundaries

Use npm with exact direct dependency versions and package-lock.json; Node 22.23.2 (.nvmrc), Next.js 16.4.3 App Router, React 19.3.1, strict TypeScript, Tailwind 4.3.3. Exact tool versions: @axe-core/playwright 4.14.0, @playwright/test 1.64.1, @types/node 22.20.5, @types/react 19.3.0, @types/react-dom 19.3.0, eslint 9.39.5, eslint-config-next 16.4.3, typescript 6.0.3, vitest 5.0.5. ESLint 9.39.5 is retained for the peer ranges of Next’s import/React/accessibility plugins; npm reports its upstream support deprecation. Review the lint dependency family together before upgrading to ESLint 10; overriding incompatible peer ranges is not the chosen baseline. Planned: shadcn/ui CLI 4.22.1 (owned components, add when needed), Drizzle ORM 0.45.4 with better-sqlite3 13.0.3, @node-rs/argon2 2.2.2 for Argon2id; validate native binaries on macOS and linux/arm64 before adopting. These planned packages are not installed or verified yet. Use Vitest 5.0.5, Playwright 1.64.1 and axe. Docker Compose and GitHub Actions; no Supabase, Vercel, Redis, Kubernetes, hosted database, or paid service.

Route handlers authenticate and validate requests. Domain/dispatcher code must not import UI components. SQLite repositories isolate persistence. Adapters use a typed capability contract and an allowlist of server-configured integration destinations. Home Assistant tokens never enter browser bundles. No arbitrary target URLs. Never equate dispatch, acceptance, display, speech and acknowledgment.

## Commands and verification

`npm ci`, `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run start`, `npm run test:e2e`, `npm run check:quiet`. Development binds to loopback. E2E uses a separate loopback port 3217 and refuses an existing server. Build before E2E. Full application checks are lint, typecheck, unit tests, build; run relevant browser/mobile/axe checks for UI changes. Internal docs need diff/link/consistency/whitespace checks. Applied migrations are immutable; schema changes require migration/reset/persistence tests when persistence exists. Keep failure logs under ignored .verification. Record actual commands, tested tree/revision and limitations. Never invent hardware results.

## Git and CI

Permanent protected branches: main (production history), staging (integration). Task branches from current staging: feat/*, fix/*, docs/*, chore/*. All changes through PRs to staging; only same-repository staging may promote to main with a history-preserving merge. Conventional commits. Do not force-push, delete protected branches, bypass checks, or delete unmerged work. Bootstrap exception: a new empty repository needs one empty root commit to create main/staging before task branching; the scaffold itself is reviewed in a task PR. The owner authorized initial pushes/protections on 2026-10-25.

Before each push, PR creation/reopening, merge or manual CI trigger, obtain an explicit Local or Cloud destination; one answer covers a push and accompanying PR. Check runner availability, set and read back CI_RUNNER, perform the authorized operation, and verify actual runner. Never silently fall back. Fork PRs use cloud only, documented exception. No remote or branch-protection changes without authorization. Local checks require no CI destination choice.

## Safety and operations

No live notifications in CI. CI must use disposable databases, mock adapters, separate ports and isolated credentials; never reset household data. Separate development, CI, staging and production volumes. No live secrets, public exposure, router changes or hardware claims without authorization/evidence. Secure server sessions, Argon2id, login throttling, CSRF/origin checks and authenticated authorization are required before household access. Trusted HTTPS is required for credentials from other devices. The current scaffold has none of those features; keep it local.

Before closing, update HANDOFF.md with implemented/merged/deployed states separately, checks and exact next action. Do not commit unless requested or needed for an explicitly agreed delivery step.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
