export type HomeAssistantTarget =
  | { kind: "notify_service"; service: string; supportsTitle: boolean }
  | { kind: "notify_entity"; entityId: string; supportsTitle?: boolean }
  | { kind: "android_tv"; profileId: string; service: string; supportsTitle: boolean; presentation: { duration: number; position: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center"; fontsize: "small" | "medium" | "large" | "max"; color: "grey" | "black" | "indigo" | "green" | "red" | "cyan" | "teal" | "amber" | "pink"; transparency: "0%" | "25%" | "50%" | "75%" | "100%" } }
  | { kind: "browser_push"; profileId: string; browser: string; supportsTitle: boolean }
  | { kind: "google_broadcast"; profileId: string; rooms: string[] }
  | { kind: "tts"; entityId: string; ttsEntityId: string };
export interface DiscoveredTarget {
  id: string; name: string; capabilities: ("text" | "speech" | "overlay")[];
  type: "computer" | "speaker" | "tv" | "phone"; reportedUnavailable: boolean; target: HomeAssistantTarget;
}
export interface HomeAssistantStatus { configured: boolean; message: string }
export function targetMethod(target: HomeAssistantTarget) {
  switch (target.kind) {
    case "android_tv": return `Android TV overlay · ${target.presentation.duration}s · ${target.presentation.position}`;
    case "browser_push": return `Browser push · ${target.browser}`;
    case "google_broadcast": return `Google Assistant Broadcast · rooms: ${target.rooms.join(", ")}`;
    case "tts": return "Cast / media-player speech · may interrupt playback";
    case "notify_entity": return "Home Assistant notify entity · text";
    case "notify_service": return "Home Assistant notify action · text";
  }
}
