# Messaging and queue behavior

Milestone 2 introduced mock-only messaging. Milestone 3 adds separately labeled real Home Assistant dispatch; follow [HA setup](home-assistant.md). The mock behavior described here is unchanged. Registration accepts the server-owned mock adapter, text/speech/overlay capabilities, computer/speaker/TV categories and deterministic simulated responses. Browser registration never accepts target URLs, webhooks, Home Assistant tokens or arbitrary adapter names. HA destinations are derived from a server-configured instance. Physical delivery, display, speech and acknowledgment are unverified regardless of a mock result.

## Run and upgrade

Use [Start everything / stop everything](daily-operations.md) for startup/shutdown, dependency updates, restart requirements and worker controls. That guide owns service operation; this page owns queue behavior and delivery evidence. The supervised web/worker pair shares the configured SQLite database; there is no external queue server.

Migration 0001 adds mock behavior to existing devices (default acceptance), messages, deliveries and attempts. Migration 0000 is unchanged. Upgrade tests preserve administrator credentials, existing sessions and device fixtures from the original schema. Back up persistent data before operational upgrades; no destructive reset is provided. The worker uses the same restrictive file permissions, foreign keys, WAL and busy timeout as the web app.

## Sending and status evidence

The composer supports an optional 100-character title, 1–1000-character body, one delivery mode, low/normal/high priority and 1–50 device selections. It previews the exact message/recipients before submission. Disabled/incompatible selections block sending. The server repeats validation, deduplicates IDs and inserts the message and all per-device deliveries in one immediate transaction, or inserts nothing on rejection. Priority is carried as adapter metadata; current queue order follows due time, not priority scheduling.

Mutations require a valid administrator session and exact configured Origin. Messaging/device JSON is bounded to 16 KiB (authentication remains 4 KiB). GET responses are no-store and authenticated. API calls return queued records, not delivery claims.

| State | Meaning in this milestone |
| --- | --- |
| queued | Persisted and waiting for its next due attempt. A prior failure may have scheduled a retry. |
| processing | A worker holds a fenced lease for this attempt. |
| dispatched | Simulated dispatch only; no simulated receiver acceptance. |
| accepted | Simulated receiver acceptance only; no physical display/speech evidence. |
| failed | Permanent rejection/configuration/device issue, or the retry budget was exhausted. |

Acknowledgment is never fabricated. Device mock tests are recorded as test messages and leave lastTestAt (physical verification evidence) unchanged. The receiver behavior selector configures a simulation, not a connectivity status: acceptance, dispatch only, fail once then accept, permanent rejection, or always unavailable.

## Worker and recovery

The worker polls every 500 ms, processes batches of at most 20 due deliveries and claims work inside an immediate SQLite transaction. Adapter configuration and send calls execute outside the transaction, with a 10-second overall deadline and AbortSignal. A stable per-delivery idempotency key is supplied on every attempt.

A claim has a random lease token and 30-second expiry. Expired processing attempts become interrupted. Mock deliveries are requeued within the three-attempt budget; real Home Assistant deliveries end failed with ha_outcome_unknown and are not automatically repeated. Completion is fenced by token/state so a stale worker cannot overwrite a newer attempt. Transient failures retry after 1 second then 2 seconds, with a maximum of three attempts total. Permanent failures do not retry. Thrown provider errors become a fixed sanitized code; secrets/provider exception text are not stored or returned. Adapters normalize results into the typed contract.

Leases and idempotency keys do not guarantee physical exactly-once delivery. Real ambiguous outcomes stop without automatic retry; check the receiver before an explicit resend. Mock retries remain simulations and perform no network I/O. Automated fixture checks do not establish live receiver behavior.

Ambiguous real HA POST outcomes are not automatically retried, and their simulated flag stays false even on failure. For stalled queues, use the [status/recovery checks](daily-operations.md#status-checks-and-recovery); web liveness alone does not establish worker or receiver readiness. Retention/pruning and deployment supervision remain later operational work; history grows until an authorized retention feature is added.

## Device changes and history

Disabling/removing is checked when submitting and again before attempts; already-started calls may finish. Device deletion sets delivery deviceId to null while retaining the friendly-name/adapter snapshot and full attempt history. Queued work then fails as removed. Resend creates a new history entry linked to the original and rejects removed, disabled or incompatible original recipients; compose a new message to choose replacements.

History is paginated at 20 messages with sender, creation time (explicit UTC), recipients, mode/priority, result, sanitized failure reason and expandable attempts. Pending detail pages poll authenticated status; the worker runs without an open browser. Groups/templates and automatic acknowledgment remain outside this milestone. Milestone 3 implements HA registration and separate manual test observation.

## Protected endpoints

- GET/POST /api/devices; GET/PATCH/DELETE /api/devices/:id; POST /api/devices/:id/test.
- GET/POST /api/messages; GET /api/messages/:id; POST /api/messages/:id/resend.
- History pagination: GET /api/messages?page=1 (20 rows, hasMore). Server rejects invalid page bounds.

Browser tests use distinct temporary databases and loopback ports 3217/3218, including the actual app launcher and worker. Unit tests exercise two competing worker connections, stale completion fencing, retry deadlines/exhaustion, preserved history, migration upgrades, authorization and origin checks. No tests inherit household notification credentials.
