# Home Assistant setup and verification

Milestone 3 implements the integration and tests it with owned fixtures. A separate HAOS instance has now been installed in UTM on the development Mac; its onboarding endpoint responds. On 2026-10-25 the owner reported a successful send to a Google Home speaker, but not TVs. The report does not include models, selected modes, exact messages or per-target API outcomes; TV delivery remains unresolved and broad hardware compatibility is not established. This is separate from application deployment. You can start the Hub with all HA variables blank and use the existing mock devices first.

For Google Broadcast room profiles, Android TV overlay appearance, native Companion notifications and targeted browser push, continue with the [real receiver guide](real-devices.md). TV models can be supplied later; no model-specific success is assumed.

## First run of the Hub

Follow [administrator setup](administrator-setup.md#first-installation) for the sole first-installation/env/secret procedure. For daily startup, shutdown and restart, use [Start everything / stop everything](daily-operations.md). The Hub setup secret and HA access token are different credentials; the table below explains them. Keep existing .env.local and data when adding HA later.

## Prepare a Home Assistant instance separately

Installing/running the Hub does not install Home Assistant. Use an already reachable HA instance or follow the official [macOS installation guide](https://www.home-assistant.io/installation/macos/). It describes HA OS in a VM with bridged networking. The development Mac now runs the UTM instance described below. Its web onboarding was verified during installation; subsequent speaker success is owner-reported, and TV support still needs device-specific validation.

Configure notification integrations and any TTS provider/media players in HA first. Confirm the desired action works there before testing from the Hub. HA must have a stable LAN address; reserve it through your normal network administration process rather than relying on an address that may be reassigned. This task does not change router settings.

Create a long-lived token on your HA profile under Security. Use a dedicated user with the permissions needed to read states/actions and call the intended notifications. Store the token only in the server environment/.env.local; never paste it in chat, put it into a browser field, commit it or use a NEXT_PUBLIC_ variable. The [official REST API](https://developers.home-assistant.io/docs/api/rest/) documents token authorization, states and action calls.

## Install Home Assistant OS with UTM on Apple silicon

These are installation steps for a new Mac/VM. For the existing Home Assistant Hub VM below, skip installation and continue with onboarding/connection; do not create a duplicate or replace its disk.

1. Install UTM from its [official website](https://mac.getutm.app/) or run `brew install --cask utm` if Homebrew is installed. Open UTM and complete any first-launch prompts. Allow Automation access if using Terminal to manage its VMs.
2. Obtain the stable **generic-aarch64 QCOW2** image from the official [Home Assistant OS releases](https://github.com/home-assistant/operating-system/releases). Check its SHA-256 against that release's asset digest, then extract the .xz archive. Use ARM64 on Apple silicon; do not substitute an x86 image. Keep downloads outside the source repository.
3. Create a dedicated ARM64/aarch64 QEMU VM in UTM with hardware virtualization and UEFI enabled, at least 2 vCPUs and 2 GiB RAM (this installation uses 4 GiB). Import the extracted QCOW2 as its boot disk using VirtIO. The selected image has 32 GiB virtual capacity; allow space for growth and backups on the Mac. An installer ISO is not required.
4. Configure bridged networking on the Mac's active physical Wi-Fi/Ethernet interface. This Mac currently uses en0; another Mac may differ. Keep it on the intended private household network. The [official macOS guide](https://www.home-assistant.io/installation/macos/) describes bridged networking and lists UTM as an alternative hypervisor.
5. Start the VM and allow first boot to prepare Home Assistant. Query the guest's LAN address using UTM after its guest agent is ready, or use the address shown by its console. Open the HA web address, normally `http://<VM-IP>/` or `http://<VM-IP>:8123/`. Preparation can take time; see [official onboarding](https://www.home-assistant.io/getting-started/onboarding/).
6. Complete onboarding in the browser: choose a new installation, create your own HA owner account, set the household location/time zone, choose analytics preferences and review discovered integrations. The HA account is separate from the Hub administrator. Retain credentials privately.
7. Configure Google Cast and a TTS provider in HA for speech, or the appropriate notification receiver integration for text. A discovered TV/media player does not by itself provide text notifications. Follow the TV section below before registering a TV as a text target.

## Create the Home Assistant token and connect the Hub

1. In Home Assistant, open your user profile → Security → Long-lived access tokens → Create token. Name it Home Notification Hub and copy the generated value directly into the existing Hub .env.local. Use a dedicated integration user where practical; do not put the value in chat or documentation.
2. Set HOME_ASSISTANT_URL to the HA origin that serves the API directly, HOME_ASSISTANT_ADDRESS to its pinned private IP, and HOME_ASSISTANT_TOKEN to the value from HA. Use the installed VM address/direct port recorded in the [daily guide](daily-operations.md#start-everything). Keep your other existing .env.local settings and Hub database.
3. Follow the [Hub restart procedure](daily-operations.md#restart-or-update) so both web and worker load the new environment, then sign in using the exact configured APP_ORIGIN.
4. In Hub Settings, discover targets, then register a supported target. Use the explicit real-device test flow only when ready for the receiver to make sound/display a message. Record observation only after personally confirming that exact test.

| Credential | Created by | Purpose |
| --- | --- | --- |
| HUB_SETUP_SECRET | npm run setup:secret | One-time Hub administrator creation. Enter the same value in the Hub form's Server setup secret field; remove it from .env.local after setup and restart. |
| Hub administrator password | You, in Hub setup | Sign in to the Hub. |
| Home Assistant account password | You, in HA onboarding | Sign in to Home Assistant. |
| HOME_ASSISTANT_TOKEN | Home Assistant profile → Security | Authorize the Hub's HA API access. npm run setup:secret cannot generate this token. |

## Installed UTM instance on the development Mac

Installed on 2026-10-25: notarized UTM 5.0.8, official Home Assistant OS 18.3 generic-aarch64 QCOW2 image. The compressed image SHA-256 was verified against the official GitHub release metadata before extraction. VM **Home Assistant Hub** uses aarch64 QEMU with hardware acceleration and UEFI, 2 vCPUs, 4096 MiB RAM, a 32 GiB virtual VirtIO disk, and bridged Wi-Fi interface en0. It has no shared household folder. Its black UTM preview is not a web dashboard; use the browser.

Runtime address/port details, VM status/address commands, startup/shutdown order and persistent-data locations are consolidated in [daily operations](daily-operations.md). Its address is DHCP-assigned and can change; no router settings or automatic startup service were installed. Follow that guide rather than creating another VM for daily use.

Docker Desktop is not the selected HA host; the official [container requirements](https://www.home-assistant.io/installation/linux/#install-home-assistant-container) exclude Docker Desktop. A container image was downloaded while evaluating it, but no HA container/volume was created.

During installation the URL/address were populated and the token was left blank for owner entry. The owner has since reported speaker success; token contents and account settings were not inspected to document that report. Use the connection steps above for future setup. An empty catalog can mean no supported notification integrations or TTS/player pairs are configured.

## Server configuration

Example values below are illustrative; replace them with your own HA address and token locally:

```dotenv
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_ADDRESS=192.168.1.50
HOME_ASSISTANT_TOKEN=YOUR_OWN_LONG_LIVED_TOKEN
```

The URL is an origin only: no /api suffix, user/password, query or fragment. Supported ports are 8123, HTTP 80 or HTTPS 443. HOME_ASSISTANT_ADDRESS pins the connection to an approved RFC1918 IPv4, IPv6 ULA or loopback address. A literal-IP URL can omit ADDRESS; if supplied it must match the URL literal. Hostname URLs require ADDRESS. The client connects directly to that IP without resolving the hostname; the logical hostname is still used for Host and TLS identity. Address changes require an operator update and restart, never automatic DNS retargeting.

Public, unspecified, multicast, IPv4-mapped IPv6, link-local/metadata and common IPv4 network/broadcast addresses are rejected. Arbitrary ports, proxy paths and redirects are rejected. DNS rebinding cannot move the socket to another host, and browser requests cannot provide a new origin/address or arbitrary service URL.

Prefer trusted HTTPS for the HA connection. HTTP is supported for standard local HA setups, but it does not encrypt the bearer token on the LAN. For a private HA certificate authority, trust its public CA certificate through NODE_EXTRA_CA_CERTS before starting Node. Certificate verification stays enabled and HTTPS logical-host identity must match. Do not use NODE_TLS_REJECT_UNAUTHORIZED=0. The Hub dashboard's separate trusted-HTTPS household deployment remains later work; keep its current development access on loopback.

Restart the app launcher after changing environment or worker/domain code. Missing/invalid HA configuration disables real adapters while keeping mocks and administrator access operational. Live HA configuration is disabled when the application is run with CI set.

## Discover and register

1. Open Settings → Home Assistant connection. Configured means the server has valid settings, not that a connection/device test succeeded.
2. Click Discover targets. The backend performs read-only GET /api/services and /api/states; it does not scan the LAN or send notifications. Only a filtered target catalog is returned; credentials and unrelated entity attributes are not exposed.
3. Choose a target, friendly name, room and category, then Register target. The server discovers again before accepting the identifier, derives its capabilities, rejects duplicate/unavailable targets and stores no token in SQLite.
4. Open Devices. Friendly name, room/category and enabled state can be edited. HA target identifiers/capabilities are read-only; remove/re-register to change the destination. Disabling/removing does not recall an already-started call.

Supported recipes:

| Recipe | Capability | Mapping and limits |
| --- | --- | --- |
| Device-specific notify action | Text | POST notify/service from the actual catalog. Native title is sent only when the action declares it; otherwise title is included in message text. Untargeted notify.notify/reload are excluded. |
| notify.* entity | Text | notify.send_message with one explicit entity_id. Title, when supplied, is included in the message text. |
| TTS provider + media player | Speech | tts.speak with explicit tts entity and media_player_entity_id. Discovery requires the player to advertise PLAY_MEDIA support; this is a candidate capability, not proof of audible playback. |

[Notify documentation](https://www.home-assistant.io/integrations/notify/) distinguishes entity-based and older device-specific actions. A Companion app receiver may depend on internet push services and OS permissions/background behavior. [TTS documentation](https://www.home-assistant.io/integrations/tts/) covers provider/media requirements. Player eligibility uses the [HA core PLAY_MEDIA feature flag](https://github.com/home-assistant/core/blob/dev/homeassistant/components/media_player/const.py), not its friendly name/model. Cast players must be able to fetch HA's audio URLs; an internal URL pointing only to localhost or an untrusted certificate can prevent speech even if the Hub reaches HA.

The Milestone 3 baseline implements Cast/media-player TTS. Milestone 4 adds explicit server-configured Google Assistant Broadcast profiles, described in the receiver guide. SDK Broadcast has separate cloud OAuth and targeting behavior; it is not silently substituted. TTS may interrupt playback; volume and media restoration are not controlled here. Priority is retained in Hub history but is not mapped to platform-specific critical notifications. Acknowledgment is not advertised. Milestone 4 adds configured legacy Android TV overlay profiles and HA browser-push profiles; model-specific behavior still needs physical evidence. Windows/Roku setup and limitations are documented separately.

## Google Home speakers and TVs

Owner report, 2026-10-25: sending worked for a Google Home speaker, but not TVs. This is a limited manual report, not an automated test or a compatibility certification. Speaker/TV models, firmware, exact message, selected delivery mode and per-target status were not supplied. Keep TV delivery marked unresolved; do not record failed TV sends as physical verification.

First identify the intended TV behavior:

| Intended result | Required HA setup | Current Hub behavior |
| --- | --- | --- |
| Spoken message through a Cast-capable TV | Google Cast media player plus a working TTS provider; TV/player available and able to fetch HA audio | A discovered TTS/player pair can be registered for speech when PLAY_MEDIA is advertised. That flag does not prove the TV will play it. |
| Text over the picture on Android TV/Google TV | Compatible Notifications for Android TV receiver app on the TV, its required permissions, and the HA notification integration | Register the resulting supported notify entity/action as a text target. The Hub uses basic notification text; advanced overlay options require the explicit legacy-action profile in the receiver guide; basic notify text remains available. |
| Text on another TV platform | A supported notification receiver/integration for that model | A media-player entity alone does not establish text/overlay support. Roku and other platform-specific alternatives remain later work. |

For speech, test the same provider/player combination directly in HA's Developer tools → Actions with `tts.speak`. Check the TV is available, awake, not muted, and using the intended audio output. Confirm the TV can fetch the generated audio from HA's LAN URL; a URL pointing at localhost, an unreachable host or an untrusted certificate can prevent playback. Use the [Google Cast documentation](https://www.home-assistant.io/integrations/cast/) for discovery/known-host options. Successful speaker playback does not prove another receiver can play the same audio or is reachable.

For Android TV/Google TV text, use the receiver app **on the TV**, not only the phone sender app. Grant notification access and display-over-other-apps permissions where available, then add **Notifications for Android TV / Fire TV** under HA Settings → Devices & services. Follow the [official integration instructions](https://www.home-assistant.io/integrations/nfandroidtv/); compatibility and permissions must be checked on the actual model. Test its `notify.send_message` action against the resulting TV notify entity in HA before rediscovering/registering it in the Hub. Older installations may expose a device-specific notify action instead. An eligible basic notify target can display text through its receiver even though the Hub does not advertise a separate overlay capability.

If the TV still fails, record its make/model/OS, speech versus text, HA integration/entity, whether the direct HA action works, Hub History status and actual receiver behavior. This distinguishes receiver/network configuration from a Hub dispatch issue. No live troubleshooting action is performed by these documentation updates. Device-specific validation remains Milestone 4 owner work; receiver profiles are documented in the receiver guide.

## Test and record evidence

From Devices choose Send test notification, read the real-send prompt and explicitly confirm. The test includes a short unique code (resending a test creates a fresh code and no inherited observation); compare that code/body on the intended receiver. This makes a real call only after you have configured your own instance and chosen the action.

A normal HA action response records Dispatched to Home Assistant, never receiver display/speech/acknowledgment. The API response contains changed states, not delivery proof. Mock results retain their separate simulated labels. Mixed recipient lists show each integration's evidence independently.

For a completed real test, use Record physical observation only after personally seeing/hearing that exact test. Confirm displayed for text/overlay or spoken for speech. The observer, time and observation are stored separately from the transport result, and lastTestAt is updated only from this explicit manual evidence. It is not automatic user acknowledgment. Ordinary messages, mock tests, queued work and mismatched observations cannot be confirmed. A removed recipient cannot gain new verification. Ambiguous completed tests can be manually observed without rewriting the failed/unknown transport outcome.

The transport has bounded responses (2 MiB), five-second requests and an eight-second adapter/discovery budget under the queue's ten-second deadline. Definite rate-limit rejections can use the bounded three-attempt queue policy. Lost/aborted/malformed/oversized POST responses and server errors are treated as unknown outcomes without automatic retry: the notification may already have happened. Inspect the receiver before explicitly resending. HA does not provide an idempotency guarantee for these action calls.

Record hardware model/firmware, HA/integration version, application revision, date, exact code/message, selected target/mode, API outcome, observed display/speech and limitations (background, Focus/permissions and media playback). Until that is done, hardware compatibility remains unverified. See [hardware checklist](hardware-validation.md).

## Troubleshooting and portability

- Not configured: check all server variables, approved address/port and restart. A hostname requires its pinned IP. The Settings page never edits or reveals the token.
- Credential rejection: check token validity and the HA user's permissions. Provider response bodies are not shown or logged; errors use fixed sanitized messages.
- Empty discovery: add supported notify entities/actions or a TTS provider and PLAY_MEDIA-capable player in HA. Discovery caps the filtered catalog at 500 candidates and does not infer arbitrary TV overlay or Roku support.
- Dispatch without output: test the same action in HA; check receiver app/OS permissions, internet push dependencies and audio URL reachability. Do not mark the Hub test successful from HTTP status alone.
- Docker Desktop/macOS discovery: the Hub uses REST and a pinned IP, not mDNS. HA's own Cast/multicast discovery still depends on its host network. Timebox it; the current bridged UTM VM has verified web connectivity; multicast and device discovery still need separate validation.
- Pi migration: update the fixed HA origin/address/environment and restore persistent data using the later validated deployment procedure. No app rewrite or token exposure to the browser is needed; physical Pi deployment remains untested.

## Automated evidence

Unit tests use synthetic credentials, injected catalogs and owned ephemeral loopback HTTP servers. They cover address/port/path rejection, pinned sockets/Host headers, redirects, size/time bounds, safe error classification, registration, mixed dispatch and manual evidence authorization. The migration rebuild test preserves sessions, queued/completed records, recipient FKs and attempts and checks foreign_key_check.

Browser tests launch an owned HA double on loopback 8123 (never reuse an existing server), then two app/worker pairs with separate temporary databases on 3217/3218. Child app HA variables are explicitly overwritten with the fixture's pinned loopback origin and synthetic token; CI is cleared only in those fixture child environments so real HTTP code can run against that owned server. The outer CI guard and normal application defaults remain unchanged. Existing household HA variables are never inherited. Port conflicts fail instead of falling back. Browser flows exercise the real backend for discovery/registration, TTS, mixed notify delivery and a synthetic manual-observation interaction; only the unconfigured-status UI case is doubled in the browser. None of those observations is physical hardware evidence.
