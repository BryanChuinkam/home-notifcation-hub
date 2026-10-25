import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import type { Store } from "../db/store";
import { admins, deliveries, deliveryAttempts, devices, messages } from "../db/schema";
import { AuthError } from "../auth/service";
import { behaviorNames, modes } from "../../lib/messaging";
import { mockAdapter } from "./mock";
import type { DeliveryResult, ErrorCode, MessageDetail, NotificationAdapter } from "./types";
const label = (max: number) => z.string().trim().min(1).max(max).refine(value => !/[\x00-\x1f\x7f]/.test(value));
const deviceInput = z.object({ name: label(80), room: label(60), type: z.enum(["speaker", "tv", "computer"]), adapter: z.literal("mock"),
  capabilities: z.array(z.enum(modes)).min(1).max(3).transform(values => [...new Set(values)]), enabled: z.boolean(), mockBehavior: z.enum(Object.keys(behaviorNames) as [keyof typeof behaviorNames, ...(keyof typeof behaviorNames)[]]),
}).strict();
const messageInput = z.object({ title: z.string().trim().max(100).default(""), body: z.string().trim().min(1).max(1000),
  mode: z.enum(modes), priority: z.enum(["low", "normal", "high"]), recipients: z.array(z.string().min(1).max(80)).min(1).max(50),
}).strict();
function parsed<T>(result: z.ZodSafeParseResult<T>, message: string): T { if (!result.success) throw new AuthError(422, message); return result.data; }
export const MAX_ATTEMPTS = 3;
export const LEASE_MS = 30000;
export const ADAPTER_TIMEOUT_MS = 10000;
export function createMessaging(store: Store, options: { clock?: () => number; adapters?: NotificationAdapter[]; timeoutMs?: number } = {}) {
  const { db } = store; const now = options.clock ?? Date.now;
  const registry = new Map((options.adapters ?? [mockAdapter]).map(adapter => [adapter.id, adapter]));
  function getDevice(id: string) { const device = db.select().from(devices).where(eq(devices.id, id)).get(); if (!device) throw new AuthError(404, "Device not found."); return device; }
  function listDevices() { return db.select().from(devices).orderBy(asc(devices.name)).all(); }
  function addDevice(input: unknown) { const data = parsed(deviceInput.safeParse(input), "Provide a name, room, device type, mock behavior and at least one supported capability."); return db.insert(devices).values({ ...data, id: randomUUID() }).returning().get(); }
  function editDevice(id: string, input: unknown) {
    const patch = parsed(deviceInput.partial().refine(value => Object.keys(value).length > 0).safeParse(input), "Provide valid device fields and at least one capability.");
    return db.transaction(tx => { const current = tx.select().from(devices).where(eq(devices.id, id)).get(); if (!current) throw new AuthError(404, "Device not found."); return tx.update(devices).set(patch).where(eq(devices.id, id)).returning().get(); }, { behavior: "immediate" });
  }
  function removeDevice(id: string) { if (!db.delete(devices).where(eq(devices.id, id)).returning({ id: devices.id }).get()) throw new AuthError(404, "Device not found."); }
  function submit(adminId: number, input: unknown, kind: "message" | "test" = "message", resendOf: string | null = null) {
    const data = parsed(messageInput.safeParse(input), "Enter a message of 1–1000 characters, a title up to 100 characters, a supported mode/priority and 1–50 recipients.");
    const ids = [...new Set(data.recipients)];
    return db.transaction(tx => {
      const admin = tx.select().from(admins).where(eq(admins.id, adminId)).get(); if (!admin) throw new AuthError(401, "Please sign in to continue.");
      const recipients = tx.select().from(devices).where(inArray(devices.id, ids)).all();
      if (recipients.length !== ids.length) throw new AuthError(422, "A recipient was removed. Update your recipient selection.");
      for (const device of recipients) {
        if (!device.enabled) throw new AuthError(422, "A selected device is disabled. Update your recipient selection.");
        if (!device.capabilities.includes(data.mode) || !registry.get(device.adapter)?.capabilities.includes(data.mode)) throw new AuthError(422, "A selected device or adapter does not support this delivery mode.");
      }
      const id = randomUUID(), createdAt = now();
      tx.insert(messages).values({ id, senderId: admin.id, senderName: admin.username, title: data.title, body: data.body, mode: data.mode, priority: data.priority, kind, resendOf, createdAt }).run();
      tx.insert(deliveries).values(recipients.map(device => ({ id: randomUUID(), messageId: id, deviceId: device.id, deviceName: device.name, adapter: device.adapter, state: "queued" as const, nextAttemptAt: createdAt, createdAt, simulated: true }))).run();
      return id;
    }, { behavior: "immediate" });
  }
  function detail(id: string): MessageDetail {
    const message = db.select().from(messages).where(eq(messages.id, id)).get(); if (!message) throw new AuthError(404, "Message not found.");
    const targets = db.select().from(deliveries).where(eq(deliveries.messageId, id)).orderBy(asc(deliveries.deviceName)).all();
    const attempts = targets.length ? db.select().from(deliveryAttempts).where(inArray(deliveryAttempts.deliveryId, targets.map(target => target.id))).orderBy(asc(deliveryAttempts.number)).all() : [];
    return { ...message, deliveries: targets.map(target => ({ ...target, attempts: attempts.filter(attempt => attempt.deliveryId === target.id) })) };
  }
  function history(page = 1) {
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw new AuthError(400, "Choose a valid history page.");
    const rows = db.select({ id: messages.id }).from(messages).orderBy(desc(messages.createdAt), desc(messages.id)).limit(21).offset((page - 1) * 20).all();
    return { messages: rows.slice(0, 20).map(row => detail(row.id)), page, hasMore: rows.length > 20 };
  }
  function resend(adminId: number, id: string) {
    const old = detail(id); if (old.deliveries.some(target => !target.deviceId)) throw new AuthError(422, "An original recipient was removed. Compose a new message with current recipients.");
    return submit(adminId, { title: old.title, body: old.body, mode: old.mode, priority: old.priority, recipients: old.deliveries.map(target => target.deviceId!) }, old.kind, old.id);
  }
  function testDevice(adminId: number, id: string) { const device = getDevice(id); return submit(adminId, { title: "Device test", body: "Test notification from Home Notification Hub.", mode: device.capabilities.find(capability => modes.includes(capability as typeof modes[number])), priority: "normal", recipients: [id] }, "test"); }
  function claim() {
    return db.transaction(tx => {
      const expired = tx.select().from(deliveries).where(and(eq(deliveries.state, "processing"), isNotNull(deliveries.leaseUntil), lte(deliveries.leaseUntil, now()))).all();
      for (const target of expired) {
        tx.update(deliveryAttempts).set({ state: "interrupted", completedAt: now(), errorCode: "interrupted" }).where(and(eq(deliveryAttempts.deliveryId, target.id), eq(deliveryAttempts.number, target.attemptCount), eq(deliveryAttempts.state, "processing"))).run();
        tx.update(deliveries).set({ state: target.attemptCount >= MAX_ATTEMPTS ? "failed" : "queued", leaseToken: null, leaseUntil: null, nextAttemptAt: now(), completedAt: target.attemptCount >= MAX_ATTEMPTS ? now() : null, errorCode: "interrupted" }).where(eq(deliveries.id, target.id)).run();
      }
      const target = tx.select().from(deliveries).where(and(eq(deliveries.state, "queued"), lte(deliveries.nextAttemptAt, now()))).orderBy(asc(deliveries.nextAttemptAt), asc(deliveries.id)).get();
      if (!target) return null;
      const token = randomUUID(), number = target.attemptCount + 1;
      tx.update(deliveries).set({ state: "processing", leaseToken: token, leaseUntil: now() + LEASE_MS, attemptCount: number, attemptedAt: now() }).where(eq(deliveries.id, target.id)).run();
      tx.insert(deliveryAttempts).values({ id: randomUUID(), deliveryId: target.id, number, startedAt: now(), state: "processing" }).run();
      return { ...target, leaseToken: token, attemptCount: number };
    }, { behavior: "immediate" });
  }
  async function processOne() {
    const target = claim(); if (!target) return false;
    let result: DeliveryResult;
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const device = target.deviceId ? db.select().from(devices).where(eq(devices.id, target.deviceId)).get() : undefined;
      const adapter = registry.get(target.adapter);
      const message = db.select().from(messages).where(eq(messages.id, target.messageId)).get()!;
      if (!device) result = { ok: false, retryable: false, code: "removed" };
      else if (!device.enabled) result = { ok: false, retryable: false, code: "disabled" };
      else if (!adapter) result = { ok: false, retryable: false, code: "adapter_missing" };
      else if (!device.capabilities.includes(message.mode) || !adapter.capabilities.includes(message.mode)) result = { ok: false, retryable: false, code: "unsupported" };
      else {
        const operation = async (): Promise<DeliveryResult> => {
          if (!await adapter.validateConfiguration(device)) return { ok: false, retryable: false, code: "configuration" };
          return adapter.send(device, message, { idempotencyKey: target.id, attempt: target.attemptCount, signal: controller.signal });
        };
        result = await Promise.race([operation(), new Promise<DeliveryResult>(resolve => { timer = setTimeout(() => { controller.abort(); resolve({ ok: false, retryable: true, code: "timeout" }); }, options.timeoutMs ?? ADAPTER_TIMEOUT_MS); })]);
      }
    } catch { result = { ok: false, retryable: true, code: "adapter_error" }; }
    finally { if (timer) clearTimeout(timer); }
    db.transaction(tx => {
      const current = tx.select().from(deliveries).where(eq(deliveries.id, target.id)).get();
      // A worker whose lease was reclaimed must never overwrite the newer attempt.
      if (current?.state !== "processing" || current.leaseToken !== target.leaseToken) return;
      const retry = !result.ok && result.retryable && target.attemptCount < MAX_ATTEMPTS;
      const code: ErrorCode | null = result.ok ? null : result.code;
      tx.update(deliveryAttempts).set({ state: result.ok ? result.state : "failed", completedAt: now(), errorCode: code }).where(and(eq(deliveryAttempts.deliveryId, target.id), eq(deliveryAttempts.number, target.attemptCount))).run();
      tx.update(deliveries).set({ state: result.ok ? result.state : retry ? "queued" : "failed", errorCode: code, nextAttemptAt: now() + 1000 * 2 ** (target.attemptCount - 1), leaseToken: null, leaseUntil: null, completedAt: retry ? null : now(), simulated: result.ok ? result.simulated : true }).where(eq(deliveries.id, target.id)).run();
    }, { behavior: "immediate" });
    return true;
  }
  async function processDue(limit = 20) { let processed = 0; while (processed < limit && await processOne()) processed++; return processed; }
  function pendingCount() { return db.select({ count: sql<number>`count(*)` }).from(deliveries).where(inArray(deliveries.state, ["queued", "processing"])).get()!.count; }
  return { getDevice, listDevices, addDevice, editDevice, removeDevice, submit, detail, history, resend, testDevice, processOne, processDue, pendingCount };
}
export type Messaging = ReturnType<typeof createMessaging>;
