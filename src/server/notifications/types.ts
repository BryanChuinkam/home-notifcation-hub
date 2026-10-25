import type { deliveries, deliveryAttempts, devices, messages } from "../db/schema";
import type { DeliveryMode } from "../../lib/messaging";
export type RegisteredDevice = typeof devices.$inferSelect;
export type StoredMessage = typeof messages.$inferSelect;
export type Delivery = typeof deliveries.$inferSelect;
export type Attempt = typeof deliveryAttempts.$inferSelect;
export type MessageDetail = StoredMessage & { deliveries: (Delivery & { attempts: Attempt[] })[] };
export type ErrorCode = "unavailable" | "rejected" | "unsupported" | "disabled" | "removed" | "configuration" | "interrupted" | "timeout" | "adapter_error" | "adapter_missing";
export type DeliveryResult = { ok: true; state: "accepted" | "dispatched"; simulated: boolean } | { ok: false; retryable: boolean; code: ErrorCode };
export interface NotificationAdapter {
  id: string;
  capabilities: readonly DeliveryMode[];
  validateConfiguration(device: RegisteredDevice): Promise<boolean>;
  send(device: RegisteredDevice, message: StoredMessage, context: { idempotencyKey: string; attempt: number; signal: AbortSignal }): Promise<DeliveryResult>;
}
