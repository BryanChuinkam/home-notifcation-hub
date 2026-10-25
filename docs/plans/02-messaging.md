# Messaging MVP (not active)

Outcome: administrator registers mock devices, selects recipients and sends messages with truthful per-device history.

Scope: SQLite device CRUD and delivery schema, Zod validation, typed adapter contract, mock adapter, dispatcher, persistent queue/recovery, composer and history. No live household calls.

Acceptance: protected operations; bounded title/body; capability and disabled-device checks; recipient deduplication; transactional message/delivery insertion; bounded transient retries; stale lease recovery; no network in DB transactions; sanitized failures; accurate resend/history; persistence across restart. Mock outcomes are visibly simulated. Automated tests cover authorization, validation, adapter selection, status transitions, retries and UI journeys at phone/desktop sizes.

Stop after a verified mock messaging MVP and handoff. Home Assistant work requires the next bounded task.
