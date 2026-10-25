# Home Assistant setup and verification

Milestone 3 implements the integration and tests it with owned fixtures. No household HA instance, token, app deployment or physical receiver has been configured or verified by this repository work. You can start the Hub with all HA variables blank and use the existing mock devices first.

## First run of the Hub

From the repository root, use the pinned Node/npm versions. These are separate commands:

```sh
nvm use
npm ci
cp .env.example .env.local
npm run setup:secret
```

For an existing installation keep .env.local and data; do not overwrite them with the example. Put the generated setup secret into HUB_SETUP_SECRET in .env.local. It is not an administrator password and is not set automatically by the command.

```sh
npm run db:migrate
npm run dev
```

Open http://127.0.0.1:3000, create the administrator with the setup secret and your chosen credentials, then sign in. Remove HUB_SETUP_SECRET and restart after setup. npm run dev/start supervise both the web server and queue worker. The HA settings below can be added later without repeating administrator setup.

## Prepare a Home Assistant instance separately

These commands install/run the Hub; they do not install Home Assistant. Use an already reachable HA instance or follow the official [macOS installation guide](https://www.home-assistant.io/installation/macos/). It describes HA OS in a VM with bridged networking. A reachable VM/separate HA host is the initial candidate; no specific VM, Docker Desktop discovery setup or physical network topology has been tested here.

Configure notification integrations and any TTS provider/media players in HA first. Confirm the desired action works there before testing from the Hub. HA must have a stable LAN address; reserve it through your normal network administration process rather than relying on an address that may be reassigned. This task does not change router settings.

Create a long-lived token on your HA profile under Security. Use a dedicated user with the permissions needed to read states/actions and call the intended notifications. Store the token only in the server environment/.env.local; never paste it in chat, put it into a browser field, commit it or use a NEXT_PUBLIC_ variable. The [official REST API](https://developers.home-assistant.io/docs/api/rest/) documents token authorization, states and action calls.

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

This milestone implements Cast/media-player TTS, not Google Assistant Broadcast. SDK Broadcast has separate cloud OAuth and targeting behavior; it is not silently substituted. TTS may interrupt playback; volume and media restoration are not controlled here. Priority is retained in Hub history but is not mapped to platform-specific critical notifications. HA overlay and acknowledgment capabilities are not advertised. Google TV overlay setup, model-specific speaker behavior, Chrome push, Windows agents and Roku alternatives still need Milestone 4 work and physical evidence.

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
- Docker Desktop/macOS discovery: the Hub uses REST and a pinned IP, not mDNS. HA's own Cast/multicast discovery still depends on its host network. Timebox it; the official bridged VM path or a separate HA host is a candidate fallback, not a tested success here.
- Pi migration: update the fixed HA origin/address/environment and restore persistent data using the later validated deployment procedure. No app rewrite or token exposure to the browser is needed; physical Pi deployment remains untested.

## Automated evidence

Unit tests use synthetic credentials, injected catalogs and owned ephemeral loopback HTTP servers. They cover address/port/path rejection, pinned sockets/Host headers, redirects, size/time bounds, safe error classification, registration, mixed dispatch and manual evidence authorization. The migration rebuild test preserves sessions, queued/completed records, recipient FKs and attempts and checks foreign_key_check.

Browser tests launch an owned HA double on loopback 8123 (never reuse an existing server), then two app/worker pairs with separate temporary databases on 3217/3218. Child app HA variables are explicitly overwritten with the fixture's pinned loopback origin and synthetic token; CI is cleared only in those fixture child environments so real HTTP code can run against that owned server. The outer CI guard and normal application defaults remain unchanged. Existing household HA variables are never inherited. Port conflicts fail instead of falling back. Browser flows exercise the real backend for discovery/registration, TTS, mixed notify delivery and a synthetic manual-observation interaction; only the unconfigured-status UI case is doubled in the browser. None of those observations is physical hardware evidence.
