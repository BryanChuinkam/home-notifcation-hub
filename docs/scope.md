# Scope

Approved long-term requirements are preserved in [the source specification](reference/implementation-specification.md); the [workflow adoption](reference/workflow-adoption.md) governs bounded delivery. The initial documentation/scaffold task is complete and PR #1 is merged into staging.

## Current task: Milestone 1

On 2026-10-25 the owner requested rebase/continue after PR #1 merged. The selected [authenticated foundation plan](plans/01-foundation.md) covers SQLite/Drizzle and immutable migrations, secure one-time single-admin setup, credentials/sessions/authorization, CSRF/origin checks, persistent throttling, stored sample devices, and a responsive authenticated shell.

Acceptance: real SQLite persistence/concurrent-setup/security tests, strict lint/types/build, desktop/mobile Playwright and axe journeys, and native platform evidence with remaining limits recorded. Stop when this scope is verified and delivered for PR review. No live hardware calls, pilot credentials or deployment are needed.

Deferred: device CRUD, typed dispatcher/mock adapter sends, durable queue/retries/history (Milestone 2), then Home Assistant/ntfy, groups/templates, trusted HTTPS, application Compose and pilot/Pi deployment. Windows/Intel/physical hardware behavior is not verified by Linux ARM64 container tests.

Out of scope: custom push infrastructure if established integrations suffice, bypassing Roku restrictions, public exposure, Kubernetes/Redis, paid services or unapproved cloud compute. Registration never proves a device is online; dispatch never proves someone saw/heard a notification.
