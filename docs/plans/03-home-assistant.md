# Milestone 3: Home Assistant integration

Outcome: authenticated administrators can discover supported targets from an operator-configured Home Assistant instance, register them, queue real service calls and separately record manual receiver verification. The existing mock app remains usable without HA configuration.

Scope: server-only pinned-origin/address/token configuration, bounded non-redirecting HTTP transport, notify service/entity and TTS target discovery, immutable migration and registry support, Home Assistant adapter/worker wiring, protected discovery/registration/manual-confirmation endpoints, settings/registration and evidence UI, mocked integration tests and operator instructions.

Acceptance: no browser token or caller-controlled URLs; approved LAN/loopback address pinning prevents DNS rebinding; restricted schemes/ports/paths, deadlines, size limits and sanitized failures; fresh discovery validates registration; only declared text/speech capabilities; API success is dispatch only; ambiguous POST outcomes do not automatically retry; original migrations remain immutable and queued/history data survive upgrade; authorization/origin negative tests, request-shape/error/transport tests and desktop/mobile/axe journeys pass.

Operator setup uses HOME_ASSISTANT_URL, HOME_ASSISTANT_ADDRESS for hostname pinning, and HOME_ASSISTANT_TOKEN in server-only configuration. CI and browser tests never inherit live HA configuration. Discovery performs read-only API requests; test sends require explicit user action. Manual observation is separate from dispatch and never fabricated as automatic acknowledgment.

Stopping point: working implementation and mocked verification plus exact setup steps. Do not configure live credentials, contact household services, claim real hardware success, or start Milestone 4 automatically. User will perform initial setup after this milestone. Base staging 60266ac; branch feat/home-assistant-integration; pending release handoff carried forward.

Local acceptance: lint/types/build and 118 tests pass; two complete desktop/mobile journeys exercise actual backend discovery/registration, worker TTS dispatch, mixed mock/HA outcomes, synthetic manual observation and existing auth/messaging against an owned loopback HA fixture. No physical hardware evidence is claimed. The guide and env example provide first-run and HA configuration instructions. Exact-head CI/merge evidence belongs in HANDOFF.md and the feature PR.
