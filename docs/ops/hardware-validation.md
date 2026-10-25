# Hardware research and validation

Research checked 2026-10-25; the initial Home Assistant notify/entity/TTS adapter is implemented and fixture-tested in Milestone 3. HAOS 18.3 is installed in a bridged UTM VM on the development Mac. The owner reported successful sending to a Google Home speaker on 2026-10-25, but not TVs. Models, delivery mode, exact message and API/physical evidence details were not supplied; TV delivery remains unresolved. See [HA setup](home-assistant.md) and [receiver profiles/setup](real-devices.md). Milestone 4 adds fixture-tested room Broadcast, legacy TV overlay and targeted browser profiles; those tests do not change the physical evidence below.

| Target | Candidate and limitation |
| --- | --- |
| Google Home/Nest | Compare Assistant SDK Broadcast (cloud OAuth) with Cast/TTS (entity targeting, reachable audio URL and provider dependencies). Broadcast and Cast have different targeting and playback behavior; prove room selection, volume and restoration on each model. |
| Chromecast with Google TV | Notifications for Android TV receiver plus notification-access/display-over-apps permissions. HA documents overlays and duration; installation/firmware/application behavior still needs physical validation. |
| iPhone/Android | HA Companion registration/permissions; push may require internet; Android battery/background restrictions can interfere. |
| Windows | Investigate current HASS.Agent compatibility/maintenance; test native toast and fullscreen limitations before promising support. |
| Mac | HA Companion notifications and OS permissions/Focus; test outside browser. |
| Chrome | Later optional ntfy/Web Push; HTTPS, explicit permission and subscription needed. Do not promise delivery with all browser processes terminated. |
| Roku | HA documents media control/discovery; arbitrary system overlays are not established. Treat overlays as unavailable; evaluate opt-in app/message-screen or speaker fallback without extensive bypass work. |

Official sources: [macOS installation](https://www.home-assistant.io/installation/macos/), [Google Assistant SDK](https://www.home-assistant.io/integrations/google_assistant_sdk/), [Cast](https://www.home-assistant.io/integrations/cast/), [TTS](https://www.home-assistant.io/integrations/tts/), [Android TV notifications](https://www.home-assistant.io/integrations/nfandroidtv/), [Roku](https://www.home-assistant.io/integrations/roku/).

macOS documentation describes a HA OS virtual machine. Do not assume Docker Desktop multicast/mDNS discovery works. Before adapter development, validate container reachability and Cast discovery; try a known IP only where supported. Timebox discovery investigation. The installed bridged UTM VM has verified web onboarding reachability and subsequent owner-reported speaker success; this does not establish TV/multicast compatibility across devices. Keep Next.js development on the Mac and preserve a portable Pi configuration.

For every target above, record: device/model/firmware, receiver and HA versions, permissions and auth setup, app Git revision, date, exact test message, selected mode/targets, API result, actual display/speech, foreground/background/media-playback behavior, observed limitations, and manual confirmation if automatic evidence is unavailable. Track separately: code implemented; automated tests; HA configured; real dispatch; physical observation. None are equivalent.

## Owner testing report — 2026-10-25

| Target | Report | Evidence limits / next record |
| --- | --- | --- |
| Google Home speaker | Owner reports successful sending | Model/firmware, mode, test code, HA/provider versions and exact physical observation not supplied. Do not fabricate a Hub observation record. |
| TVs | Owner reports sending did not work | Models/platforms, speech versus text, HA direct-action result and Hub per-target outcome not supplied. Follow [TV setup and diagnosis](home-assistant.md#google-home-speakers-and-tvs) before choosing a fix. |

This report is separate from fixture results. No new notifications or live API tests were run while documenting it.

## Milestone 4 implementation versus physical validation

| Path | Implementation / automated evidence | Physical state |
| --- | --- | --- |
| Cast/TTS | Existing explicit provider/player mapping retained | Owner-reported Google speaker success; detailed test record pending |
| Google SDK room Broadcast | Strict server profiles, explicit rooms, no generic untargeted fallback; fixture verified | Google OAuth/integration and specific rooms not configured/tested by agent |
| Android TV overlay | Strict legacy action/profile with bounded duration/appearance; fixture verified. Modern notify entities remain basic text | Owner TV sends unsuccessful; model/receiver permissions/direct HA result pending |
| Companion mobile/macOS | Individual notify actions retained; advertised modern TITLE now mapped separately | Receiver setup and physical validation pending |
| Windows agent | Existing individual HA notify actions/entities can be used; compatible installation steps documented | No Windows host or compatible agent/integration tested |
| Chrome/HTML5 | One configured HA browser subscription per profile; fixture verified | HTTPS/domain setup, subscription and physical delivery pending |
| Roku | System overlays unavailable; explicitly select a speaker as a separate recipient | No Roku notification capability claimed |

Models can be supplied later. New profiles do not create permission, OAuth consent, HA integrations, receiver apps or subscription registrations. No physical observation record was added on behalf of the owner.
