import type { NotificationAdapter } from "./types";
export const mockAdapter: NotificationAdapter = {
  id: "mock", capabilities: ["text", "speech", "overlay"],
  async validateConfiguration(device) { return device.adapter === "mock"; },
  async send(device, _message, context) {
    if (device.mockBehavior === "reject") return { ok: false, retryable: false, code: "rejected" };
    if (device.mockBehavior === "offline" || (device.mockBehavior === "retry_once" && context.attempt === 1)) return { ok: false, retryable: true, code: "unavailable" };
    return { ok: true, state: device.mockBehavior === "dispatch_only" ? "dispatched" : "accepted", simulated: true };
  },
};
