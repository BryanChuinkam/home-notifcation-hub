# Home Notification Hub

A private household administrator uses a MacBook or phone to send one message to selected household devices or groups. Text, supported TV overlays, and spoken announcements share one composer but retain distinct capabilities and delivery evidence.

A typical task is sending “Dinner is ready, please come downstairs” to a Google TV, computer and speaker. The dashboard must never imply that registration means online, or that API success means anyone saw or heard the message.

Develop and initially host on macOS; migrate persistent data to a Raspberry Pi 4 (4 GB, 64-bit OS, 32 GB microSD). No required public exposure, paid service or hosted database. MacBook sleep means downtime. Real device access and permissions require owner configuration.

The supplied specification is the approved long-term product scope; the adoption document defines the current foundation-only task. MVP requirements include one admin, authenticated dashboard/APIs, device CRUD, groups, templates, multi-recipient messaging, history and truthful per-device delivery. See docs/scope.md.

Interface requirements: mobile first, touch-friendly, accessible contrast and keyboard access, prominent composer, quick recipient selection, explicit unknown/error/unsupported states. Navigation: Dashboard, Devices, Groups, History, Settings. WCAG 2.2 AA where practical. The authenticated shell follows the restrained Operate interface conventions in DESIGN.md; its sample devices are visibly labeled mock and untested. Mock messaging is implemented with previews, per-device simulated outcomes and persistent history. Real Home Assistant delivery remains a separate milestone.
