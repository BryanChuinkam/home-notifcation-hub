# Mock messaging and queue operation

Milestone 2 is mock-only. Registration accepts the server-owned mock adapter, text/speech/overlay capabilities, computer/speaker/TV categories and deterministic simulated responses. No target URLs, webhooks, Home Assistant tokens or arbitrary adapter names are accepted. Physical delivery, display, speech and acknowledgment are unverified regardless of a mock result.

## Run and upgrade

Keep the existing .env.local and persistent DATABASE_PATH. Stop a pre-Milestone-2 server, install the lockfile with `npm ci`, then run `npm run dev` or `npm run build` followed by `npm run start`. The launcher loads configuration, applies pending migrations once before spawning processes, and starts Next.js plus a queue worker using the same SQLite path. This is one application project with two processes, not an external queue service. tsx is now an exact runtime dependency for the worker and migration commands.

Migration 0001 adds mock behavior to existing devices (default acceptance), messages, deliveries and attempts. Migration 0000 is unchanged. Upgrade tests preserve administrator credentials, existing sessions and device fixtures from the original schema. Back up persistent data before operational upgrades; no destructive reset is provided. The worker uses the same restrictive file permissions, foreign keys, WAL and busy timeout as the web app.

The launcher propagates termination to both children, waits for closure and force-stops unresponsive children after 12 seconds. An unexpected web/worker exit stops the other process so a dead worker is not silently left behind. Next.js UI changes hot-reload in dev; restart the launcher for worker/domain or environment changes. Configuration is not refreshed automatically in the worker.

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

A claim has a random lease token and 30-second expiry. Expired processing attempts become interrupted; unfinished deliveries are requeued unless they already consumed three attempts. Completion is fenced by token/state so a stale worker cannot overwrite a newer attempt. Transient failures retry after 1 second then 2 seconds, with a maximum of three attempts total. Permanent failures do not retry. Thrown provider errors become a fixed sanitized code; secrets/provider exception text are not stored or returned. Future real adapters must normalize results into the typed contract.

Delivery is at least once in the face of ambiguous outcomes. Leases and idempotency keys do not guarantee physical exactly-once delivery; a future real receiver must honor the key to deduplicate. The mock adapter performs no network I/O. No live integration was exercised.

Both processes must be running for normal operation. If records stay queued, restart through the documented launcher rather than running only next dev/start. `npm run worker:once` handles one due batch and exits nonzero on processing errors; it does not wait through future retry delays. Public /api/health is process liveness, not queue/readiness or device availability. Retention/pruning and deployment supervision remain later operational work; history grows until an authorized retention feature is added.

## Device changes and history

Disabling/removing is checked when submitting and again before attempts; already-started calls may finish. Device deletion sets delivery deviceId to null while retaining the friendly-name/adapter snapshot and full attempt history. Queued work then fails as removed. Resend creates a new history entry linked to the original and rejects removed, disabled or incompatible original recipients; compose a new message to choose replacements.

History is paginated at 20 messages with sender, creation time (explicit UTC), recipients, mode/priority, result, sanitized failure reason and expandable attempts. Pending detail pages poll authenticated status; the worker runs without an open browser. Groups/templates, live Home Assistant registration, receiver confirmation and acknowledgments are outside this milestone.

## Protected endpoints

- GET/POST /api/devices; GET/PATCH/DELETE /api/devices/:id; POST /api/devices/:id/test.
- GET/POST /api/messages; GET /api/messages/:id; POST /api/messages/:id/resend.
- History pagination: GET /api/messages?page=1 (20 rows, hasMore). Server rejects invalid page bounds.

Browser tests use distinct temporary databases and loopback ports 3217/3218, including the actual app launcher and worker. Unit tests exercise two competing worker connections, stale completion fencing, retry deadlines/exhaustion, preserved history, migration upgrades, authorization and origin checks. No tests inherit household notification credentials.
