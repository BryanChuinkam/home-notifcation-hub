export type HomeAssistantTarget =
  | { kind: "notify_service"; service: string; supportsTitle: boolean }
  | { kind: "notify_entity"; entityId: string }
  | { kind: "tts"; entityId: string; ttsEntityId: string };
export interface DiscoveredTarget {
  id: string; name: string; capabilities: ("text" | "speech")[];
  type: "computer" | "speaker"; reportedUnavailable: boolean; target: HomeAssistantTarget;
}
export interface HomeAssistantStatus { configured: boolean; message: string }
