# Scope

The full product specification is preserved in [the source specification](reference/implementation-specification.md). The workflow adoption first-task instruction takes precedence over its request to implement milestones 1 and 2 immediately.

Current approved task: establish repository documentation, architectural decisions, release/verification conventions and minimum runnable development scaffold. Acceptance: local Next.js build/start/health, strict typecheck, lint, Vitest routing/health tests, desktop/mobile browser/axe smoke tests, current handoff, no real notifications or remote changes.

Deferred to bounded tasks: SQLite schema/migrations, authentication, real dashboard, device registry, messaging, groups/templates, Home Assistant and ntfy, durable retries, Docker Compose runtime, trusted HTTPS and deployment. An unprotected diagnostic page is acceptable only on loopback and contains no private data. No production-readiness claim.

Out of scope: custom push infrastructure if established integrations suffice, bypassing Roku restrictions, public exposure, Kubernetes/Redis, paid services and unapproved cloud compute. Hardware delivery remains unverified until observed.
