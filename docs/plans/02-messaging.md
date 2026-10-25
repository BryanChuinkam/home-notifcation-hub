# Messaging MVP — active

Outcome: administrator registers mock devices, selects recipients and sends messages with truthful per-device history.

Scope: SQLite device CRUD and delivery schema, Zod validation, typed adapter contract, mock adapter, dispatcher, persistent queue/recovery, composer and history. No live household calls.

Acceptance: protected operations; bounded title/body; capability and disabled-device checks; recipient deduplication; transactional message/delivery insertion; bounded transient retries; stale lease recovery; no network in DB transactions; sanitized failures; accurate resend/history; persistence across restart. Mock outcomes are visibly simulated. Automated tests cover authorization, validation, adapter selection, status transitions, retries and UI journeys at phone/desktop sizes.

Stop after a verified mock messaging MVP and handoff. Home Assistant work requires the next bounded task.

Selected 2026-10-25. Base staging 9230aec; branch feat/messaging-mvp. The pending post-release handoff is carried forward. Use a separate worker process started by the app launcher, the same SQLite database, fenced 30-second leases, 10-second adapter deadlines, three attempts with 1s/2s backoff, and a server-owned mock-only registry. No live URLs or adapter credentials are accepted. Deleting a device preserves delivery snapshots and causes unsent work to fail honestly. The app remains one deployable project with no queue infrastructure service.

Local acceptance completed: lint, strict types, build and 64 unit/security/persistence tests pass; two desktop/mobile browser journeys cover registration/edit/disable/test/removal, mode validation, preview, multi-recipient sends, automatic retry, detailed outcomes, resend, retained history and failure reporting. Axe checks and overflow checks pass across the tested screens. Queue tests cover concurrent claims, stale completion fencing, deadlines, retry exhaustion and original-schema upgrade without losing sessions. See HANDOFF.md and the feature PR for exact-head CI evidence.
