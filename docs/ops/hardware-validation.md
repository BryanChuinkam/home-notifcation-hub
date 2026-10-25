# Hardware research and validation

Research checked 2026-10-25; the initial Home Assistant notify/entity/TTS adapter is implemented and fixture-tested in Milestone 3. HAOS 18.3 is installed in a bridged UTM VM on the development Mac. The owner reported successful sending to a Google Home speaker on 2026-10-25, but not TVs. Models, delivery mode, exact message and API/physical evidence details were not supplied; TV delivery remains unresolved. See [HA setup](home-assistant.md).

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
