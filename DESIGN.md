# Architecture and technical conventions

## Request path

Browser → Next.js App Router → authenticated, Zod-validated Route Handler → notification service → SQLite delivery queue → typed adapter → Home Assistant → device. Optional ntfy later. Domain services never depend on React. Keep one app/container initially; add a separate worker process only if durable processing requires it.

Module boundaries: src/app (pages/routes), src/components/ui (owned shadcn components), src/server/auth, src/server/db, src/server/notifications, src/server/adapters. Milestone 1 implements setup/login/dashboard routes, server/auth, server/db, and owned shadcn-style Button/Input primitives. The stateless health route remains public. Health reports process liveness, not database readiness or device availability.

## Persistence and authentication decisions

Choose Drizzle + better-sqlite3 for explicit migrations and a simple embedded database. Native packages passed real macOS ARM64 and isolated Linux ARM64 install/unit/build checks; Intel Mac and physical Pi remain untested. Current tables: admins, sessions (hashed tokens), rate_limits and devices. Planned next: groups, group_devices, templates, messages, deliveries and delivery_attempts. Foreign keys, WAL, bounded busy timeout, indexed queue and retention rules. Short transactions; network calls outside transactions. Unique message/device delivery keys deduplicate recipients. Retry only transient failures with bounded backoff and maximum attempts. Delivery idempotency must account for ambiguous timeouts; retries may duplicate physical notifications.

Use a small self-hosted single-admin credentials/session module rather than a cloud identity provider. Argon2id password hashing, cryptographically random opaque session tokens stored hashed in SQLite, HttpOnly/SameSite cookies (Secure in pilot), expiration, server-side authorization, persistent throttling and same-origin/CSRF checks. Initial setup uses a server-side one-time setup secret and a transaction ensuring one admin; no default credentials. Implemented in Milestone 1 with security/persistence tests. Sessions have an eight-hour fixed expiry; global persistent throttles permit 10 login and five setup attempts per 15-minute window. Setup seeds three mock devices transactionally.

## Adapter contract

Capabilities: text, speech, overlay, acknowledgment. Registered capabilities come from configured integration support, not device branding. Result separates dispatch/receiver acceptance from independently observed display and acknowledgment. Persist queued → processing → dispatched/accepted/failed; acknowledgment requires separate evidence. Track attempts, sanitized errors, retry count and timestamps per target. Crash recovery reclaims stale leases; disabled devices and unsupported modes fail explicitly. Mock adapter produces simulated results labeled as mock, never hardware evidence.

Server-only HA origin is administrator/operator configured, with permitted schemes/ports/hosts, redirect rejection, timeouts and bounded responses. Device identifiers are service/entity identifiers, never caller-controlled URLs. No browser token access. SSRF controls must validate resolved addresses and destination policy before any live adapter is enabled.

## Environments and UI

Development binds 127.0.0.1:3000. Browser CI uses 127.0.0.1:3217/3218 with one owned temporary DB per viewport project and cannot reuse development servers; staging and pilot use different Compose project names, ports, volumes, secrets and HA configuration. No frontend build credential variables.

The authenticated shell uses Operate mode: restrained forest-green primary actions, warm neutral background/sidebar, system sans typography, consistent shadcn-style native controls, visible focus states and 44px minimum buttons. Desktop has a 224px navigation rail; mobile puts navigation above content. Device rows show mock integration, capabilities and “Not tested”, with no online lights. Setup/login are narrow, labeled single-column forms with inline errors and busy states. Messaging controls are deferred, so no inactive fake composer is shown.
