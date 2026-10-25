export const modes = ["text", "speech", "overlay"] as const;
export type DeliveryMode = typeof modes[number];
export const behaviorNames = {
  accept: "Simulated acceptance", dispatch_only: "Dispatch only", retry_once: "Temporary failure, then accept", reject: "Permanent rejection", offline: "Always unavailable",
} as const;
export const stateNames: Record<string, string> = { queued: "Queued", processing: "Processing", dispatched: "Simulated dispatch", accepted: "Simulated acceptance", failed: "Failed", interrupted: "Interrupted" };
export const errorNames: Record<string, string> = {
  unavailable: "The mock receiver is temporarily unavailable.", rejected: "The mock receiver rejected this message.",
  unsupported: "This device or adapter does not support the selected mode.", disabled: "This device is disabled.",
  removed: "This device was removed.", configuration: "The adapter configuration is unavailable.",
  interrupted: "The worker was interrupted before completing this attempt.", timeout: "The adapter timed out; its outcome is unknown.",
  adapter_error: "The adapter could not complete this attempt.", adapter_missing: "The configured adapter is unavailable.",
};
export function dateLabel(value: number) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(value) + " UTC"; }
