# Architecture and technical conventions

## Request path

Browser → Next.js App Router → authenticated, Zod-validated Route Handler → notification service → SQLite delivery queue → typed adapter → Home Assistant → device. Optional ntfy later. Domain services never depend on React. Keep one app/container initially; add a separate worker process only if durable processing requires it.

Planned modules: src/app (pages/routes), src/components/ui (owned shadcn components), src/server/auth, src/server/db, src/server/notifications, src/server/adapters. Only src/app and a stateless health route exist now. Health reports process liveness, not database readiness or device availability.

## Persistence and authentication decisions

Choose Drizzle + better-sqlite3 for explicit migrations and a simple embedded database. Validate native builds on Apple Silicon, Intel and linux/arm64 in milestone 1. Tables planned: admin, hashed sessions, login attempts, devices, groups, group_devices, templates, messages, deliveries, delivery_attempts. Foreign keys, WAL, bounded busy timeout, indexed queue and retention rules. Short transactions; network calls outside transactions. Unique message/device delivery keys deduplicate recipients. Retry only transient failures with bounded backoff and maximum attempts. Delivery idempotency must account for ambiguous timeouts; retries may duplicate physical notifications.

Use a small self-hosted single-admin credentials/session module rather than a cloud identity provider. Argon2id password hashing, cryptographically random opaque session tokens stored hashed in SQLite, HttpOnly/SameSite cookies (Secure in pilot), expiration, server-side authorization, persistent throttling and same-origin/CSRF checks. Initial setup uses a server-side one-time setup secret and a transaction ensuring one admin; no default credentials. Implementation and security tests are deferred to milestone 1.

## Adapter contract

Capabilities: text, speech, overlay, acknowledgment. Registered capabilities come from configured integration support, not device branding. Result separates dispatch/receiver acceptance from independently observed display and acknowledgment. Persist queued → processing → dispatched/accepted/failed; acknowledgment requires separate evidence. Track attempts, sanitized errors, retry count and timestamps per target. Crash recovery reclaims stale leases; disabled devices and unsupported modes fail explicitly. Mock adapter produces simulated results labeled as mock, never hardware evidence.

Server-only HA origin is administrator/operator configured, with permitted schemes/ports/hosts, redirect rejection, timeouts and bounded responses. Device identifiers are service/entity identifiers, never caller-controlled URLs. No browser token access. SSRF controls must validate resolved addresses and destination policy before any live adapter is enabled.

## Environments and UI

Development binds 127.0.0.1:3000. Browser CI uses 127.0.0.1:3217 and cannot reuse development servers. Future CI DB uses an isolated temporary directory; staging and pilot use different Compose project names, ports, volumes, secrets and HA configuration. No frontend build credential variables.

The current unstyled diagnostic page proves rendering and health only. Product design will use restrained, legible typography, generous grouping, accessible focus states, and responsive native controls. No fake online lights. No device dashboard or visual system is approved by this foundation task.
