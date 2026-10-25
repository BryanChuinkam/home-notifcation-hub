# Current handoff

## Current task and delivery state

2026-10-25: owner selected Milestone 3 and will perform first app/HA setup afterward. Active branch: feat/home-assistant-integration, based on staging `60266ac178374fdebb3a38bf97c6c6235d5d74d0`. Pending post-release handoff carried forward. PRs #4/#5 merged Milestone 2 into staging/main; main remains `1f19e625cb31f5d81a73d07dbd2cc4488cea2f39` until a future release. Milestone 3 is implemented and locally verified, not merged or deployed. Its feature PR records exact-head CI/merge state.

Owner explicitly selected **Local** for this milestone's push and accompanying PR. A fresh isolated runner was provisioned and reported online/idle; set/read CI_RUNNER=local and verify availability immediately before publishing. Leave the PR open for owner review and stop before Milestone 4.

## Implemented

- Optional server-only HOME_ASSISTANT_URL/ADDRESS/TOKEN configuration. Pinned RFC1918/ULA/loopback sockets without DNS, logical Host/TLS identity, mandatory certificate verification, fixed schemes/ports/methods/paths, no redirects, 2 MiB responses and bounded request deadlines. Invalid/missing config leaves mocks operational. No browser token/URL editing or raw provider errors.
- Read-only services/states discovery for targeted legacy notify actions, modern notify entities and TTS provider/PLAY_MEDIA-capable player pairs. Fresh discovery validates registration, derives only text/speech capabilities and rejects duplicate/unavailable targets. No untargeted notify.notify, overlay or acknowledgment claim.
- HA adapter and worker registry wiring: successful action response means dispatched with simulated=false; mock results stay separate. Ambiguous POST failures/timeouts/server errors do not automatically retry. Definitive rate-limit rejection can use the bounded queue policy.
- Migration 0002 transactionally rebuilds related device/delivery/attempt tables and adds separate observer/type/time evidence. Original migrations unchanged. Upgrade tests preserve credential/session data, historical recipient FKs, completed attempts and queued work. Phone/tablet category supported; HA destination/capabilities are read-only after registration.
- Settings/discovery/registration UI, explicit real-test consent, mixed-integration preview/results and manual test observation. Tests include unique codes; resends receive fresh codes and no inherited observation. Manual observation updates physical lastTestAt only after explicit authorized action and never rewrites dispatch state or claims automatic acknowledgment.
- Expanded env example and [complete first-run/HA operator guide](docs/ops/home-assistant.md), with macOS hosting/networking, token setup, security/port policy, TTS limitations, troubleshooting and physical-verification steps. These instructions do not install HA automatically.

## Verification

Tested source/config manifest SHA-256: `d05890d0cac64f53db2da08289301b26172dc11fc75dcc9a435a6ebdd929ab0e` (sorted relative path + NUL + bytes + NUL over src/scripts/tests/migrations and top-level app/test configs/package files). The feature commit captures that content; its PR provides the exact tested Git head and CI result.

- On macOS ARM64 with Node 22.23.2/npm 10.9.8: npm run check:quiet passed lint, strict types, **118 tests** and production build.
- Tests include owned loopback HTTP servers for actual transport pinning/headers, redirects, size/time limits and safe errors, plus catalog/request mappings, config/CI guards, registration, no mock fallback, real dispatch flags, ambiguous-outcome handling, manual observation authorization and data-preserving upgrades with foreign_key_check.
- npm run test:e2e passed **both complete desktop/mobile journeys** through actual backend discovery/registration, worker TTS dispatch, mixed mock/HA notify delivery and synthetic observation controls, alongside existing auth/registry/retry/history flows. Axe/overflow checks passed on tested screens; desktop/mobile settings/evidence screenshots were inspected. Detector's system-font warning is accepted for the inherited Operate interface.
- Browser tests own HA fixture 127.0.0.1:8123 and distinct app/worker databases/ports 3217/3218. Child HA env is replaced with fixture-only values and synthetic token; CI is cleared only for those owned fixture children. Outer CI and normal live-config guard remain unchanged. Existing servers are not reused. None of the test observations is hardware evidence.

## Exact next action and limits

Complete the authorized Local push/PR to staging, verify Required gate for its exact head and stop for review. No live HA URL/token, household service or physical receiver was used; no administrator was created outside temporary test databases. Application deployment, trusted dashboard HTTPS, actual HA configuration/discovery and successful physical display/speech all remain unverified owner actions.

After selecting the next task, follow the HA guide for real validation or prepare Milestone 4's hardware-specific plan. Do not automatically configure credentials, publish services, change networking or start hardware work. SDK Broadcast, volume/media restoration, HA overlays/acknowledgment, groups/templates, retention, application Compose, tested backup/restore, Intel/physical Pi/Safari verification remain pending. HTTP HA connections are unencrypted; prefer trusted HTTPS and stable pinned addresses. Test port 8123 conflicts fail safely instead of contacting an existing instance.
