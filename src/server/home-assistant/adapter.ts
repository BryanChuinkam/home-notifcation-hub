import type { HomeAssistantClient } from "./client";
import { HomeAssistantError, targetSchema } from "./client";
import type { NotificationAdapter } from "../notifications/types";
export function homeAssistantAdapter(client: HomeAssistantClient): NotificationAdapter {
  return { id: "home_assistant", capabilities: ["text", "speech", "overlay"],
    async validateConfiguration(device) { return device.adapter === "home_assistant" && targetSchema.safeParse(device.haTarget).success; },
    async send(device, message, context) {
      try {
        const target = targetSchema.safeParse(device.haTarget);
        if (!target.success || (target.data.kind === "tts" || target.data.kind === "google_broadcast" ? message.mode !== "speech" : target.data.kind === "android_tv" ? !["text", "overlay"].includes(message.mode) : message.mode !== "text")) return { ok: false, retryable: false, code: "unsupported" };
        await client.send(target.data, message.title, message.body, AbortSignal.any([context.signal, AbortSignal.timeout(8000)]));
        return { ok: true, state: "dispatched", simulated: false };
      } catch (error) { return error instanceof HomeAssistantError ? { ok: false, retryable: error.retryable, code: error.code } : { ok: false, retryable: false, code: "ha_outcome_unknown" }; }
    },
  };
}
