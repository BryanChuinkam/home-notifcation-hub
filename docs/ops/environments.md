# Environment and deployment plan

No Docker deployment, Home Assistant instance or HTTPS has been provisioned in this task. Only the local development scaffold is runnable.

| Environment | Process/data boundary | Notifications |
| --- | --- | --- |
| Development | loopback 3000, future data/development | mock by default |
| CI | loopback 3217, disposable temp DB and workspace | mocks only |
| Staging | separate hnh-staging Compose project, ports/volumes/secrets | controlled test data/targets |
| Pilot/production | hnh-pilot project, persistent DB and HA configuration | owner-configured registered targets |

Keep SQLite files outside disposable containers. Future Compose must include restart policy, health/readiness checks, non-root app, bounded logs and a persistent volume, with no public port exposure by default. Caddy or equivalent provides trusted HTTPS before credentials from another device. Document local hostname/DNS, CA install/trust on Mac/iPhone/Android and certificate renewal; no public router changes are needed. macOS sleep interrupts service.

Deploy compatible schema first, backend/worker next, frontend last; validate staging before a staging→main release PR. A merge is not a deployment. Keep rollback backups and tolerate old/new app overlap where practical. Do not deploy destructive migrations without an explicit recovery procedure.
