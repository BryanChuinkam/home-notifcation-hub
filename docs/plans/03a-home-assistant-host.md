# Home Assistant host setup

Owner authorized installing and initially configuring Home Assistant on this Mac on 2026-10-25, before Milestone 4.

Outcome: boot official ARM64 Home Assistant OS in a dedicated UTM VM, verify its local onboarding endpoint, and document startup/shutdown and Hub connection. Scope: UTM, official stable OS image, dedicated VM data, private LAN networking, and server-only Hub configuration after owner onboarding. Preserve existing Hub data, credentials, running services and unrelated edits. No device notification, pairing, router configuration, public access, release, or Milestone 4 work.

Acceptance: image integrity checked; VM starts; local HTTP onboarding responds; runtime/version/location and remaining owner steps recorded. Owner chooses Home Assistant account credentials and completes household onboarding, then creates a token locally without posting it in chat. Stop at that interaction if needed; do not invent physical-device validation. No commit/push requested.

## Progress

- Mac: Apple silicon, macOS 27.0.1, 24 GiB RAM; active physical interface en0.
- Installed notarized UTM 5.0.8 through Homebrew.
- Downloaded official HAOS 18.3 generic-aarch64 QCOW2 image, verified compressed SHA-256 f54b659f12c665038134bdf9d4235903048056257368f82369dc230131f5a675 against GitHub release metadata, extracted locally. Image has 32 GiB virtual capacity.
- Source images are under ~/Library/Application Support/Home Notification Hub/home-assistant/downloads, outside the repository.
- Owner considered Docker, then explicitly chose UTM. Official container image 2026.10.4 downloaded only; no container/volume/service was created. Docker Desktop is excluded by HA's supported container installation requirements.
- Planned VM: Home Assistant Hub, aarch64 QEMU with hardware acceleration/UEFI, 2 vCPUs, 4096 MiB RAM, VirtIO disk, bridged en0. VM created and started successfully after initial Automation access became available. No device notifications performed.

## Verified result and stopping point

- VM ID ACA2A5F2-7F28-45D4-B50E-EBDF76329289 is started. Guest agent reports physical LAN IP 10.0.0.211; MAC matches the bridged interface configuration.
- HTTP port 8123 redirects to port 80. Direct http://10.0.0.211/api/onboarding responds HTTP 200 with all onboarding steps incomplete; /api/ correctly requires authentication (401). Frontend serves Home Assistant onboarding. Browser opened for owner.
- Populated only previously blank HOME_ASSISTANT_URL=http://10.0.0.211 and HOME_ASSISTANT_ADDRESS=10.0.0.211 in ignored .env.local. HOME_ASSISTANT_TOKEN was left blank for owner entry at installation time; all other existing settings were preserved. No app restart or household data reset performed.
- At installation handoff, stopped for owner onboarding and local token entry. Owner subsequently reported speaker success; see the follow-up below. Installation/onboarding reachability is verified; TV delivery and broader hardware validation remain unresolved. Current DHCP address can change. No deployment/promotion, startup automation, backup-restore or hardware validation claimed.

## Documentation follow-up scope (2026-10-25)

Owner requested Home Assistant setup documentation and reported successful sending to a Google Home speaker, but not TVs. Update repeatable installation/onboarding/token/Hub connection steps, distinguish setup secret from HA token, and document TV speech versus text receiver prerequisites. Record the report without inventing device models, API outcomes or per-device physical evidence. Acceptance: consistent guide/checklist/handoff, valid local links and clean whitespace checks. Stop after local documentation edits; no live troubleshooting calls, device sends, code changes, commit or push requested.


## Documentation follow-up result

Added repeatable UTM installation/onboarding steps, HA token generation and a credential-purpose table; linked the guide from README. Added TV speech/text prerequisites and diagnosis using official Cast/Android TV notification documentation. Updated hardware checklist and handoff with owner-reported speaker success and unresolved TVs, without inventing missing model/mode/API evidence. Historical installation checks remain labeled separately. Documentation diff/whitespace and relative file/fragment links checked; no app test rerun or live sends for this prose-only task. Owner subsequently authorized a documentation commit, push and PR to staging using a fresh isolated Local runner. Leave the PR open after verifying its Required gate; exclude the unrelated next-env.d.ts runtime edit.
