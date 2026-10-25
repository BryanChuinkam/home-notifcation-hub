# Real receivers: setup and validation

Milestone 4 adds explicit Google SDK room Broadcast, bounded Android TV legacy-action overlays, targeted HA browser push and native notify-entity titles. Existing Cast/TTS and individual notify actions remain available. These are implementation capabilities, not evidence that a particular receiver works. The owner reported Google Home speaker success and unsuccessful TV sends on 2026-10-25; model, mode and detailed test records remain pending. You can supply make/model later.

Start with the [Home Assistant installation and connection guide](home-assistant.md). Keep the Hub on its configured loopback origin until the separate trusted-HTTPS deployment work is ready. No receiver installation, OAuth authorization, router change or live message is performed by automated tests.

## Optional explicit profiles

Set HOME_ASSISTANT_DEVICE_PROFILES in the Hub's existing .env.local to a single-line JSON array. Leave it blank to retain ordinary notify/TTS targets. Configure the underlying receiver in HA first. Example identifiers and Google room/browser names below are illustrative; replace them with values from your own setup:

```dotenv
HOME_ASSISTANT_DEVICE_PROFILES='[{"id":"downstairs","name":"Downstairs Google announcement","kind":"google_broadcast","rooms":["kitchen","living room"]},{"id":"living_tv","name":"Living room TV overlay","kind":"android_tv","service":"living_room_tv","presentation":{"duration":10,"position":"bottom-right","fontsize":"medium","color":"grey","transparency":"25%"}},{"id":"office_browser","name":"Office Chrome","kind":"browser_push","browser":"office_chrome"}]'
```

Restart `npm run dev` so both web and worker load the profiles, then Hub Settings → Discover targets. A profile appears only if its required action/fields are advertised by HA. Registration re-discovers the target and persists the server-derived recipe. The operator is responsible for identifying the correct Android TV action/browser subscription; the Hub does not infer integration ownership from an arbitrary action name. Discovery does not contact the physical receiver.

Profiles have unique lowercase IDs (letters, numbers, underscores; up to 64 characters), names up to 80 characters and at most 50 entries. Android TV services must be unique across profiles. Unknown fields, arbitrary URLs/paths/images/icons and invalid presentation values are rejected. Invalid profile JSON disables HA configuration with a sanitized error; mocks remain available. A profile's name is a label, not a targeting command.

Removing a profile or changing its room list, browser subscription, TV action or presentation makes existing registrations fail closed when the worker processes them. Remove/re-register the target after such changes; do not expect queued work to retarget itself. Restart after every environment change. Renaming a profile alone does not retarget an existing registration. Disable/remove a registered target to stop future sends; already-started calls cannot be recalled.

No generic SDK or HTML5 action is advertised as an individual text device because omitting its target can broadcast to other receivers. Old registrations using those generic actions now fail validation; replace them with explicit profiles. Other existing notify/TTS recipes and historical records remain compatible; no database migration is needed.

## Google Home / Nest announcements

### Cast speech

1. Add Google Cast in HA Settings → Devices & services and configure a TTS provider.
2. Check the desired media player is available and supports media playback. Test `tts.speak` directly in HA with that provider/player pair.
3. Make sure the receiver can fetch the generated audio from HA's reachable LAN URL. Localhost or an untrusted/unreachable audio URL can prevent playback even when the Hub reaches HA.
4. Discover/register that specific TTS/player pair in the Hub. Select speech, review, and explicitly send a real test when ready.

Cast speech can interrupt playback. Configurable volume and media/volume restoration are not implemented; this release does not adjust them. See [Google Cast](https://www.home-assistant.io/integrations/cast/) and [TTS](https://www.home-assistant.io/integrations/tts/).

### Google Assistant SDK Broadcast

1. Follow HA's [Google Assistant SDK setup](https://www.home-assistant.io/integrations/google_assistant_sdk/) for its required Google project/OAuth credentials and consent. Those credentials belong in HA, not the Hub or chat. This optional integration is not installed automatically.
2. Confirm `notify.google_assistant_sdk` exists and test explicit rooms directly in HA. These are **Google Assistant rooms**, not the Hub room label or HA area.
3. Add a google_broadcast profile listing 1–10 distinct room names. No empty list/implicit whole-house target is accepted. Room names allow letters, numbers, spaces, apostrophes and hyphens, up to 60 characters.
4. Discover and register the speech-only profile. Its room list appears during registration, on the device, in real-test consent and in message review. A title is included as a prefix to the spoken message.

HA documents Broadcast as avoiding interruption of current media, with cloud/account and language-dependent targeting limitations. That is provider behavior, not an independently verified guarantee here. Do not use it as a fallback from failed Cast speech. Overlapping Google profiles or selecting both a profile and a Cast target for the same speaker can produce duplicate audible messages; choose recipients deliberately. No SDK room was configured or physically tested by this implementation.

## Android TV / Chromecast with Google TV

Decide whether you want audio through the TV or text over its picture. A media player does not imply text/overlay support. Cast speech uses the preceding provider/player flow.

For text, install the compatible **Notifications for Android TV** receiver on the TV itself, enable notification access and display-over-other-apps permissions where the model permits them, then add HA's [Notifications for Android TV / Fire TV integration](https://www.home-assistant.io/integrations/nfandroidtv/). Test its action directly in HA before using the Hub.

Two paths are supported:

- Modern notify entity: discover/register it as text. Native title is sent separately only when the entity advertises TITLE support; older/non-TITLE recipes retain the title prefix in the message. No advanced appearance fields are added to notify.send_message.
- Legacy TV action: if HA still exposes a device-specific action such as notify.living_room_tv with message and data fields, declare its suffix (`living_room_tv`) in an android_tv profile. Register the resulting TV target for overlay/text. The Hub sends only title/message and bounded presentation, with interactive interruption disabled. The profile is an explicit operator assertion that this is the configured TV receiver action; metadata alone cannot prove the receiver's identity.

Presentation defaults: 10-second duration, medium font, bottom-right, grey, 25% transparency. Bounds: duration 1–60 seconds; font small/medium/large/max; position bottom-right/bottom-left/top-right/top-left/center; color grey/black/indigo/green/red/cyan/teal/amber/pink; transparency 0/25/50/75/100%. No remote image, local file, custom command or arbitrary data is accepted. If only a modern notify entity exists, use basic text; a profile cannot manufacture a missing legacy action. HA 2026.10.4 source supports these legacy fields; newer integrations can change their available actions, so inspect your actual catalog.

The current HA development branch contains a separate nfandroidtv.send_message action; it is not an allowlisted Hub action in this implementation. Do not assume development-branch features are available on the installed stable version. Model-specific overlay/fullscreen/DRM/standby behavior still requires physical validation.

## iPhone, Android and macOS

1. Install the official Home Assistant Companion app on each intended receiver and connect it to your HA instance with its own device registration. Follow [Companion onboarding](https://companion.home-assistant.io/docs/getting_started/).
2. Grant OS notification permissions. Check Focus/Do Not Disturb; on Android also inspect background/battery restrictions. Some push paths depend on internet services. Mac notifications require the macOS app and OS permission; opening the Hub in a browser does not register native notifications.
3. Find the specific notify.mobile_app_* action in HA and test it directly. If it is absent, follow the [Companion troubleshooting guide](https://companion.home-assistant.io/docs/troubleshooting/faqs/), including any required HA restart.
4. Discover/register that action in Hub Settings; choose phone/tablet or computer as appropriate. The automatic mobile_app category is only a starting label; it can be edited. Send a text test and inspect the actual OS notification.

Native message/title is supported when advertised. Critical priority, OS bypasses, actionable acknowledgment and notification clicks are not mapped by this milestone. High Hub priority alone does not bypass Focus. Test background/locked-screen behavior on each receiver; an API response is insufficient.

## Windows

HASS.Agent is a candidate receiver, not bundled Hub infrastructure. Its [maintainer installation guide](https://www.hass-agent.io/2.1/getting-started/installation/) describes a Windows client, matching HA integration and MQTT prerequisites for that release family. Review the chosen release's current requirements before installing; forks and integration generations differ. No Windows host/version has been supplied or tested here.

On the Windows computer, install/configure a compatible agent and its corresponding HA integration using that project's instructions. Enable Windows notifications and test a basic toast from HA. If it exposes an individual notify action or notify entity, the Hub can discover/register it as a computer text target. An integration that exposes only an unrelated custom action is not supported automatically; do not enter its URL into the Hub. Record the actual HA action/entity and versions before adding another adapter. Exclusive fullscreen games, Focus and sleeping/offline hosts can prevent visible notifications.

## Chrome / browser push

The browser_push profile targets one already registered HA HTML5 browser subscription. It does not create a service worker or notification permission/subscription for the Hub itself.

1. Follow [HA HTML5 push setup](https://www.home-assistant.io/integrations/html5/). Its requirements include valid HTTPS and domain verification/reachability conditions. The current HTTP-only HA VM does not meet that setup; do not enable public access just to satisfy this guide. Trusted HTTPS/deployment remains separate work.
2. In a supported browser, open HA via its configured HTTPS address, profile → This browser, enable Receive notifications and accept browser permission. Test notifications in HA and note that subscription's target name.
3. Create a browser_push profile naming that exact lowercase/underscore subscription identifier. The Hub accepts one explicit browser per profile, never an empty/wildcard target.
4. Discover/register it as a computer text target, then explicitly test. A syntactically valid profile does not prove the subscription exists; HA/receiver testing is still needed.

The Hub calls notify.html5 with a one-element target list and no arbitrary push endpoint. Multiple receivers require multiple explicit profiles. Browser termination, OS power settings and expired permission/subscriptions affect delivery; no guarantee is made when all browser processes are terminated. No HTTPS, browser subscription or physical push was configured/tested here. Optional ntfy/custom Hub PWA delivery is not implemented.

## Roku and other TVs

HA's [Roku integration](https://www.home-assistant.io/integrations/roku/) provides media/remote functions; arbitrary system-wide notification overlays are not established by those functions. This Hub does not advertise Roku overlays or automatically launch content/change input as a notification fallback. An available media player is not evidence that it supports TTS or overlays.

For the MVP, explicitly select a configured Google speaker for speech when the TV cannot display a message. That is a separate recipient chosen by the administrator, not a silent fallback. A dedicated Roku message-screen/app would need its own verified implementation and owner consent to interrupt viewing; it remains unavailable here.

## Verification and failure handling

Test each desired action directly in HA first, then the matching Hub target/mode. Record model/firmware, HA/integration versions, Hub revision, exact test code, per-target API outcome, what was physically heard/seen, and behavior during playback/locked screen/standby. See [hardware evidence checklist](hardware-validation.md). Unsupported modes stay disabled. Physical observation is recorded only by the person who checks the receiver.

A successful Hub action records dispatch, not display, speech or acknowledgment. Definite rate limiting can retry within the existing queue budget. Ambiguous POST results are not automatically repeated. If a worker dies with a real delivery in progress, lease recovery marks the result unknown and stops; a late worker cannot overwrite it. Inspect the receiver before an explicit resend, which is a new delivery/test code. Mock lease recovery retains its retry behavior.

Configuration and automated fixture tests do not complete the physical Milestone 4 exit criterion. TV models and hardware validation can be added later. No household credentials, receiver setup or platform support is fabricated to close that gap.
