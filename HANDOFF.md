# Current handoff

## Current task and delivery state

2026-10-25: owner selected Milestone 2. Active branch: `feat/messaging-mvp`, based on staging `9230aeceec2ec4ca97e342883b3778d50f92c140`. The pending release handoff was carried forward and reconciled here. PRs #1/#2 remain merged; PR #3 promoted Milestone 1 to main at `949fb2cd420fa10caa788a15d4222d6ddf0c6e5d`. Milestone 2 is implemented and locally verified; its feature PR is the delivery record for exact-head CI/merge state. Nothing from this milestone is merged or deployed yet.

Owner's latest instruction is **Local runner**, superseding the briefly selected Cloud destination. No Cloud push/PR/run was started for this milestone. Provision a fresh isolated runner, confirm online/idle, set/read CI_RUNNER=local, then perform the authorized feature push and accompanying PR to staging. Leave it open for owner review; do not merge or start Milestone 3 automatically.

## Implemented

- Add/edit/enable/disable/remove mock devices with bounded names/rooms, explicit text/speech/overlay capabilities and configurable simulated behavior. No arbitrary adapter IDs, target URLs or integration credentials are accepted. Mock device tests create separate test messages without changing physical lastTestAt evidence.
- Prominent composer with optional title, bounded body, one mode, priority metadata, 1–50 selections, recipient deduplication and preview. Unsupported/disabled selections block the UI and are rejected atomically on the server. Message plus per-recipient delivery records are inserted in one transaction.
- Typed, UI-independent adapter contract and a server-owned mock registry. Simulations cover acceptance, dispatch only, transient failure once, permanent rejection and repeated unavailability. Results never claim display/speech/acknowledgment on hardware.
- SQLite persistent queue, per-attempt records, immediate transactional claims, 30-second fenced leases, 10-second adapter deadlines and three-attempt limit with 1s/2s backoff. Adapter operations run outside DB locks. Expired attempts are interrupted/requeued within budget; stale completion cannot overwrite a reclaimed attempt. Exception text is sanitized to fixed codes and a stable delivery idempotency key is passed to adapters.
- Authenticated paginated history/detail pages with outcomes, sanitized reasons, attempts/retries, live polling and resend after revalidation. Deletion preserves delivery snapshots and history; unsent removed-device work fails honestly. Resend creates a new linked message.
- Additive immutable migration 0001; original migration 0000 unchanged. App launcher now migrates and supervises web plus worker processes; tsx is a runtime dependency. Both normal app commands and per-viewport E2E servers use that launcher. See [messaging operations](docs/ops/messaging.md).

## Verification

Tested source/config manifest SHA-256: `ad1998dffcd868767823ea77d851b527969e8b0188081925ad30d0ca13bcc5c1` (sorted relative path + NUL + bytes + NUL over src/scripts/tests/migrations and top-level app/test/config files and package files). The feature commit captures that content; its PR records the exact Git head and current CI result.

On macOS ARM64 with Node 22.23.2/npm 10.9.8:

- `npm run check:quiet` passed lint, strict types, **64 tests** and production build. Tests cover registry/validation/authorization, atomic deduplication, actual SQLite persistence/reopen, adapter selection, transient/permanent failures, retry exhaustion, missing/disabled/changed recipients, timeouts, sanitized errors, two competing connections, stale completion fencing, resend and history pagination.
- A real original-schema upgrade fixture preserves the admin password hash, session token digest and all three device fixtures while applying the new migration, then successfully processes queued mock work.
- `npm run test:e2e`: **2/2 complete desktop/mobile Chromium journeys passed** through setup/login, registry CRUD and testing, incompatible-mode blocking, preview/multi-recipient send, automatic retry, detailed outcomes, resend, deletion with retained history, rejection reporting and logout/unauthenticated redirects. These use actual separate worker processes and owned temporary databases on loopback 3217/3218.
- Axe found zero violations for configured WCAG tags on tested setup/login/composer/devices/history/detail screens; overflow assertions passed. Desktop/mobile screenshots were reviewed in a bounded pass and one correction pass. Detector's system-font warning is accepted for the inherited Operate interface.
- npm lockfile audit reported zero vulnerabilities. No real device, household database, administrator credentials or notification service was used. Initial generated next-env.d.ts dev-type changes were preserved through normal Next type generation; no unrelated user file was reset.

## Next action and limits

Complete the authorized Local PR delivery, verify the exact-head Required gate and stop for owner review. On the next owner-selected task, begin Milestone 3 from updated staging after merge: server-only Home Assistant configuration/discovery and explicit receiver verification. Do not interpret mock success as real integration evidence.

Existing operators must stop pre-Milestone-2 servers, keep .env.local/data, run npm ci and restart through npm run dev/start so both web and worker run. Restart the launcher for worker/domain/env changes. Pending jobs resume independently of browser sessions. Queue processing is at least once under ambiguous outcomes; future physical exactly-once claims require receiver idempotence. In-flight calls can finish after a device is disabled/removed. History retention, groups/templates, app Compose/HTTPS, tested backup/restore, Intel/physical Pi/Safari and all real receiver delivery remain pending. No application deployment has occurred.
