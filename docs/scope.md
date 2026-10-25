# Scope

Approved long-term requirements are preserved in [the source specification](reference/implementation-specification.md); the [workflow adoption](reference/workflow-adoption.md) governs bounded delivery. The initial documentation/scaffold task is complete and PR #1 is merged into staging.

## Current task: Milestone 3

The owner selected [Home Assistant integration](plans/03-home-assistant.md) after Milestone 2 was promoted to main. Scope: server-only HA URL/address/token configuration, restricted/pinned HTTP transport, read-only discovery, target registration, initial notify/TTS adapter, connection errors, explicit test sends and separate manual test observations. Preserve mock usability and existing database history. The owner will perform initial app/HA setup afterward.

Acceptance: safe destination/credential handling, no browser-supplied URLs or arbitrary actions, auth/origin guards, bounded requests/responses, no ambiguous-POST auto-retry, conservative capabilities, API success treated only as dispatch, migration preservation and real-code HTTP plus browser tests against owned fixtures. Stop at verified implementation/PR delivery with exact operator instructions; do not provision credentials, contact household services or claim physical verification.

Deferred: model-specific receiver setup, HA overlay/acknowledgment support, Google SDK Broadcast, volume/media restoration, groups/templates, trusted HTTPS/app Compose, tested backup/restore and physical pilot/Pi deployment. No paid services, public exposure or new cloud dependency is introduced.
