# Administrator setup and local operation

Install with the pinned Node/npm versions and follow README.md. All setup is local; this milestone does not expose a service on the LAN or configure certificates.

## Configuration

| Variable | Purpose |
| --- | --- |
| APP_ORIGIN | Exact canonical origin used for browser mutation checks. Defaults to http://127.0.0.1:3000; HTTP is permitted only for loopback, HTTPS for future trusted pilot access. No path, credentials or query. |
| DATABASE_PATH | SQLite file, default ./data/development/hub.sqlite. The parent is created if needed; file mode is 0600, new parent mode 0700, foreign keys/WAL enabled and busy timeout 5 seconds. CI must explicitly supply a separate path. |
| HUB_SETUP_SECRET | 32–256 character operator-provided secret, generated with npm run setup:secret, stored only in ignored .env.local or a server secret environment. Missing/invalid values disable setup; no fallback credential exists. |

Configuration is read server-side and never exposed through NEXT_PUBLIC_ variables. Restart the app launcher after environment or worker/domain changes. Use the configured URL consistently; browsing localhost when APP_ORIGIN uses 127.0.0.1 will intentionally fail origin checks. If using a different local port, update APP_ORIGIN to match.

The initial setup form requires the secret, a 3–32 character ASCII username (letters/numbers/dots/underscores/hyphens) and 12–128 character password. Setup uses Argon2id (19 MiB memory, two passes, one lane), then an immediate SQLite transaction rechecks singleton ownership and inserts the admin and sample devices. Concurrent setup requests cannot create multiple administrators. After success remove the setup secret and restart; setup stays closed. Backing up a credential-containing database requires access controls.

## Authentication behavior

Sessions are random 256-bit opaque tokens; only SHA-256 digests are stored. Cookies are HttpOnly, SameSite=Strict, scoped to /, expire after eight hours and use Secure for HTTPS origins. Login generates a new session token. Logout deletes its record and clears the cookie; other sessions retain their own fixed expiry. No cookie is a household-network trust exemption.

Every protected page/API validates the session server-side. Mutation routes require an exact Origin match and reject cross-site fetches; JSON requests are bounded to 4096 bytes and validated by Zod. Forwarded host/IP values cannot override these guards. Responses never return password/session hashes. Security headers block framing, content sniffing and referrer leakage; the CSP restricts framing/object/base behavior and is not a full script nonce policy.

Persistent throttles use a global budget appropriate to one admin: 10 login submissions and five setup submissions per 15-minute window. Successful logins also count. A throttled request returns 429 with Retry-After. The global policy avoids trusting spoofable proxy IP headers, but another client can temporarily exhaust the sign-in budget. Wait for the window; do not delete the database to resolve it. Password change/recovery, session inventory and multi-user administration are deferred.

## Persistence and migrations

`npm run db:migrate` loads .env.local and applies committed SQL through Drizzle. Runtime first access also applies pending migrations. Never edit an applied SQL file or its journal entry: startup verifies recorded hashes/timestamps against migration files and fails if an applied migration is changed or missing. Add a new reviewed migration and update the typed schema together. SQL is hand-reviewed; no schema-push or destructive automatic reset command is provided.

Migrations are synchronous and transactional. Use one application process and one persistent database for this milestone; shared-file multi-host operation is not supported. Backup/restore procedures must be validated before household pilot deployment. Do not copy only the main file of a live WAL database; use an online SQLite backup or stop writes cleanly.

Three deterministic mock-device rows are created only alongside initial admin setup. They advertise sample text/speech/overlay capabilities but no successful communication or online evidence. Device CRUD and mock notification dispatch are implemented in Milestone 2; see [messaging operations](messaging.md).

## Test isolation

Vitest creates and removes only its own mkdtemp directories. Persistence tests reopen actual SQLite files, validate hashes/schema/integrity, and exercise two connections competing for setup. Browser tests launch separate production servers on loopback 3217/3218 with a fresh temporary DB and synthetic setup secret for each viewport project. An existing server is never reused. The E2E launcher cleans its owned directory on shutdown; interrupted/killed OS processes can leave hnh-e2e-* temporary directories, which should be removed only after confirming their server is stopped. No test receives Home Assistant credentials or sends a notification.
