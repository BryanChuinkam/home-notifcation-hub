# Scope

Approved long-term requirements are preserved in [the source specification](reference/implementation-specification.md); the [workflow adoption](reference/workflow-adoption.md) governs bounded delivery. The initial documentation/scaffold task is complete and PR #1 is merged into staging.

## Current task: Milestone 2

The owner selected [the messaging MVP](plans/02-messaging.md) after Milestone 1 was merged into staging/main. Scope: mock-device registration/edit/disable/removal and tests, typed mock adapters, persistent delivery queue, transactional multi-recipient messages, capability validation, bounded retries/recovery, preview composer and per-device history/resend. The pending release handoff is carried forward.

Acceptance: authorized/origin-checked and bounded operations; no partial inserts; unique recipient IDs; processing outside database locks; fenced recovery, deadlines and retry exhaustion; retained removed-device history; tested migration from the Milestone 1 schema; complete desktop/mobile journeys and accessibility checks. All notifications remain simulated. Stop at verified PR delivery; no live credentials, discovery or physical sends.

Deferred: Home Assistant integration and discovery (Milestone 3), physical devices/receiver confirmation, groups/templates, trusted HTTPS, application Compose, tested backup/restore and pilot/Pi deployment. No arbitrary target URLs, cloud database, paid service, Redis/Kubernetes or public exposure is introduced. Registration never proves connectivity; acceptance never proves display, speech or acknowledgment.
