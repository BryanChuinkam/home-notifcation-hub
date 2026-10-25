# Backup and Raspberry Pi migration plan

Not executable deployment instructions yet: persistence and Compose are deferred. Implement and test these steps before the pilot.

1. Stop application writes or use SQLite's online backup API; never copy only a live WAL database main file. Verify integrity on the backup.
2. Back up the DB, HA config, integration IDs and secrets separately from source. Encrypt backups containing credentials and history, restrict permissions and document retention.
3. Restore into a disposable environment, run integrity/migration checks and prove login, groups, history and mock delivery persist before relying on a backup.
4. On Raspberry Pi OS Lite 64-bit, install Docker/Compose, build or select linux/arm64-compatible images, restore data and configuration permissions, configure hostname and trusted HTTPS, then reconnect HA targets.
5. Start with mocks; test selected real devices only with owner approval. Record device/application revisions and observed display/speech. Keep the Mac rollback snapshot until validation.

Use bounded Docker logs, application retention and batched writes to reduce microSD wear. Native SQLite/Argon2 and ARM64 images need actual build/run evidence. No ARM64 deployment or backup restore has been tested yet.
