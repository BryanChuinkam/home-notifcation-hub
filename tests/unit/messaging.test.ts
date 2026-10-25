import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openStore, type Store } from "../../src/server/db/store";
import { createAuth } from "../../src/server/auth/service";
import { createMessaging, LEASE_MS } from "../../src/server/notifications/service";
import { createMessagingHandlers } from "../../src/server/notifications/http";
import { mockAdapter } from "../../src/server/notifications/mock";
import type { DeliveryResult, NotificationAdapter } from "../../src/server/notifications/types";
const secret = "unit-only-setup-secret-not-used-in-a-live-app";
const credentials = { username: "household", password: "unit-only-password-123" };
const origin = "http://127.0.0.1:3000";
const input = { title: "Dinner", body: "Dinner is ready.", mode: "text" as const, priority: "high" as const, recipients: ["mock-tv", "mock-computer"] };
let directory: string, store: Store, auth: ReturnType<typeof createAuth>, service: ReturnType<typeof createMessaging>, clock: number;
const connections: Store[] = [];
beforeEach(async () => {
 directory = mkdtempSync(join(tmpdir(), "hnh-messaging-unit-")); store = openStore(join(directory, "hub.sqlite")); connections.push(store); clock = 1000000;
 auth = createAuth(store, secret, () => clock); await auth.setup({ ...credentials, secret }); service = createMessaging(store, { clock: () => clock });
});
afterEach(() => { for (const connection of connections.splice(0)) if (connection.raw.open) connection.close(); rmSync(directory, { recursive: true, force: true }); });
function post(path: string, body: unknown, token?: string, method = "POST", extra: Record<string, string> = {}) {
 return new Request(origin + path, { method, headers: { origin, "content-type": "application/json", ...(token ? { cookie: `hnh_session=${token}` } : {}), ...extra }, body: JSON.stringify(body) });
}
describe("registry and message validation", () => {
 it("registers, edits and disables mock devices, deduplicating capabilities", () => {
  const device = service.addDevice({ name: " Kitchen speaker ", room: "Kitchen", type: "speaker", adapter: "mock", capabilities: ["speech", "speech"], enabled: true, mockBehavior: "accept" });
  expect(device.name).toBe("Kitchen speaker"); expect(device.capabilities).toEqual(["speech"]); expect(device.lastTestAt).toBeNull();
  expect(service.editDevice(device.id, { name: "New name", enabled: false })?.enabled).toBe(false);
  expect(() => service.testDevice(1, device.id)).toThrow("disabled");
  expect(() => service.editDevice(device.id, { capabilities: [] })).toThrow();
  expect(() => service.addDevice({ ...device, targetUrl: "http://192.168.1.2" })).toThrow();
  expect(() => service.addDevice({ name: "Invalid", room: "Room", type: "tv", adapter: "untrusted", capabilities: ["text"], enabled: true, mockBehavior: "accept" })).toThrow();
 });
 it("deduplicates recipients and inserts all delivery records atomically", () => {
  const id = service.submit(1, { ...input, recipients: [...input.recipients, "mock-tv"] });
  const record = service.detail(id); expect(record.deliveries).toHaveLength(2); expect(record.senderName).toBe("household");
  expect(record.deliveries.every(target => target.state === "queued" && target.attemptCount === 0 && target.simulated)).toBe(true);
 });
 it.each([{ body: " " }, { body: "a".repeat(1001) }, { title: "a".repeat(101) }, { recipients: [] }, { recipients: Array(51).fill("mock-tv") }, { mode: "acknowledgment" }, { priority: "invalid" }, { targetUrl: "http://127.0.0.1" }])("rejects invalid input %j without partial rows", patch => {
  expect(() => service.submit(1, { ...input, ...patch })).toThrow(); expect(service.history().messages).toHaveLength(0);
 });
 it("rejects disabled, removed and incompatible recipients before inserting any message", () => {
  expect(() => service.submit(1, { ...input, recipients: ["mock-speaker"] })).toThrow("support");
  service.editDevice("mock-tv", { enabled: false }); expect(() => service.submit(1, input)).toThrow("disabled");
  expect(() => service.submit(1, { ...input, recipients: ["not-found"] })).toThrow("removed");
  expect(service.history().messages).toHaveLength(0);
 });
 it("requires an adapter with the requested capability, without silent fallback", () => {
  const restricted = createMessaging(store, { adapters: [{ ...mockAdapter, capabilities: ["speech"] }] });
  expect(() => restricted.submit(1, input)).toThrow("adapter");
 });
});

describe("durable dispatcher", () => {
 it("selects the mock adapter and keeps dispatch separate from acceptance and acknowledgment", async () => {
  service.editDevice("mock-tv", { mockBehavior: "dispatch_only" });
  const id = service.submit(1, input); await service.processDue(); const record = service.detail(id);
  expect(record.deliveries.find(target => target.deviceId === "mock-tv")?.state).toBe("dispatched");
  expect(record.deliveries.find(target => target.deviceId === "mock-computer")?.state).toBe("accepted");
  expect(record.deliveries.every(target => target.simulated && target.attempts.length === 1)).toBe(true);
  expect(JSON.stringify(record)).not.toContain("acknowledged");
 });
 it("retries only when due and records every attempt with bounded backoff", async () => {
  service.editDevice("mock-tv", { mockBehavior: "retry_once" }); const id = service.submit(1, { ...input, recipients: ["mock-tv"] });
  expect(await service.processDue()).toBe(1); let target = service.detail(id).deliveries[0]; expect(target.state).toBe("queued"); expect(target.errorCode).toBe("unavailable");
  expect(await service.processDue()).toBe(0); clock += 1000; expect(await service.processDue()).toBe(1);
  target = service.detail(id).deliveries[0]; expect(target.state).toBe("accepted"); expect(target.attemptCount).toBe(2); expect(target.attempts.map(attempt => attempt.state)).toEqual(["failed", "accepted"]);
 });
 it("stops after three transient failures and does not retry permanent failures", async () => {
  service.editDevice("mock-tv", { mockBehavior: "offline" }); service.editDevice("mock-computer", { mockBehavior: "reject" }); const id = service.submit(1, input);
  await service.processDue(); clock += 1000; await service.processDue(); clock += 2000; await service.processDue(); clock += 100000; expect(await service.processDue()).toBe(0);
  const targets = service.detail(id).deliveries; expect(targets.every(target => target.state === "failed")).toBe(true);
  expect(targets.find(target => target.deviceId === "mock-tv")?.attemptCount).toBe(3); expect(targets.find(target => target.deviceId === "mock-computer")?.attemptCount).toBe(1);
 });
 it("revalidates device state and adapter availability when processing queued work", async () => {
  const id = service.submit(1, input); service.editDevice("mock-tv", { enabled: false }); service.editDevice("mock-computer", { capabilities: ["speech"] });
  await service.processDue(); expect(service.detail(id).deliveries.map(target => target.errorCode).sort()).toEqual(["disabled", "unsupported"]);
  service.editDevice("mock-tv", { enabled: true }); const other = service.submit(1, { ...input, recipients: ["mock-tv"] });
  await createMessaging(store, { adapters: [], clock: () => clock }).processDue(); expect(service.detail(other).deliveries[0].errorCode).toBe("adapter_missing");
 });
 it("preserves removed recipient snapshots and fails queued work without corrupting history", async () => {
  const id = service.submit(1, { ...input, recipients: ["mock-tv"] }); service.removeDevice("mock-tv"); await service.processDue();
  const target = service.detail(id).deliveries[0]; expect(target.deviceName).toBe("Family TV"); expect(target.deviceId).toBeNull(); expect(target.errorCode).toBe("removed");
  expect(() => service.resend(1, id)).toThrow("removed"); expect(service.history().messages).toHaveLength(1);
 });
 it("persists queued work and history across database reopen", async () => {
  const id = service.submit(1, input); store.close(); const reopened = openStore(join(directory, "hub.sqlite")); connections.push(reopened);
  const recovered = createMessaging(reopened, { clock: () => clock }); expect(recovered.pendingCount()).toBe(2); await recovered.processDue();
  expect(recovered.detail(id).deliveries.every(target => target.state === "accepted")).toBe(true); expect(recovered.history().messages[0].id).toBe(id);
 });
 it("fences stale worker completions after another connection reclaims the lease", async () => {
  let finish!: (result: DeliveryResult) => void;
  const stalled: NotificationAdapter = { ...mockAdapter, send: async () => new Promise(resolve => { finish = resolve; }) };
  const first = createMessaging(store, { adapters: [stalled], clock: () => clock }); const id = first.submit(1, { ...input, recipients: ["mock-tv"] }); const pending = first.processOne();
  await Promise.resolve(); await Promise.resolve();
  const secondStore = openStore(join(directory, "hub.sqlite")); connections.push(secondStore); clock += LEASE_MS + 1;
  const second = createMessaging(secondStore, { clock: () => clock }); await second.processOne(); finish({ ok: true, state: "dispatched", simulated: true }); await pending;
  const target = second.detail(id).deliveries[0]; expect(target.state).toBe("accepted"); expect(target.attempts.map(attempt => attempt.state)).toEqual(["interrupted", "accepted"]);
 });
 it("claims a delivery only once across simultaneous worker connections", async () => {
  const id = service.submit(1, { ...input, recipients: ["mock-tv"] }); let release!: (result: DeliveryResult) => void;
  const slow = createMessaging(store, { clock: () => clock, adapters: [{ ...mockAdapter, send: async () => new Promise(resolve => { release = resolve; }) }] });
  const secondStore = openStore(join(directory, "hub.sqlite")); connections.push(secondStore); const other = createMessaging(secondStore, { clock: () => clock });
  const pending = slow.processOne(); await Promise.resolve(); await Promise.resolve(); expect(await other.processOne()).toBe(false); release({ ok: true, state: "accepted", simulated: true }); await pending;
  expect(service.detail(id).deliveries[0].attempts).toHaveLength(1);
 });
 it("bounds hanging adapter calls and sanitizes thrown provider errors", async () => {
  const bounded = createMessaging(store, { clock: () => clock, timeoutMs: 1, adapters: [{ ...mockAdapter, send: async () => new Promise(() => {}) }] });
  const id = bounded.submit(1, { ...input, recipients: ["mock-tv"] }); await bounded.processOne(); expect(bounded.detail(id).deliveries[0].errorCode).toBe("timeout");
  clock += 1000;
  const throwing = createMessaging(store, { clock: () => clock, adapters: [{ ...mockAdapter, send: async () => { throw new Error("private-provider-token-do-not-store"); } }] });
  await throwing.processOne(); expect(JSON.stringify(throwing.detail(id))).not.toContain("private-provider-token"); expect(throwing.detail(id).deliveries[0].errorCode).toBe("adapter_error");
 });
 it("passes priority and a stable idempotency key to adapters, outside database transactions", async () => {
  const calls: string[] = [];
  const observed = createMessaging(store, { clock: () => clock, adapters: [{ ...mockAdapter, send: async (_device, message, context) => {
   expect(store.raw.inTransaction).toBe(false); expect(message.priority).toBe("high"); calls.push(context.idempotencyKey);
   return context.attempt === 1 ? { ok: false, retryable: true, code: "unavailable" } : { ok: true, state: "accepted", simulated: true };
  } }] });
  observed.submit(1, { ...input, recipients: ["mock-tv"] }); await observed.processOne(); clock += 1000; await observed.processOne(); expect(calls).toHaveLength(2); expect(calls[0]).toBe(calls[1]);
 });
 it("resends as a new message after revalidation and records simulated device tests separately", async () => {
  const id = service.submit(1, input); await service.processDue(); const duplicate = service.resend(1, id);
  expect(duplicate).not.toBe(id); expect(service.detail(duplicate).resendOf).toBe(id); expect(service.detail(id).deliveries.every(target => target.state === "accepted")).toBe(true);
  const testId = service.testDevice(1, "mock-speaker"); expect(service.detail(testId).kind).toBe("test"); expect(service.detail(testId).mode).toBe("speech");
  service.editDevice("mock-tv", { enabled: false }); expect(() => service.resend(1, id)).toThrow("disabled");
 });
 it("paginates history and rejects invalid pages", () => {
  for (let i = 0; i < 21; i++) { clock++; service.submit(1, { ...input, title: `Message ${i}` }); }
  expect(service.history().messages).toHaveLength(20); expect(service.history().hasMore).toBe(true); expect(service.history(2).messages).toHaveLength(1);
  expect(() => service.history(-1)).toThrow(); expect(() => service.detail("not-found")).toThrow("not found");
 });
 it("upgrades a milestone-1 database without losing credentials, sessions or fixtures", async () => {
  const oldFolder = join(directory, "old-migrations"); cpSync("migrations", oldFolder, { recursive: true });
  const journalPath = join(oldFolder, "meta", "_journal.json"); const journal = JSON.parse(readFileSync(journalPath, "utf8")); journal.entries = journal.entries.slice(0, 1); writeFileSync(journalPath, JSON.stringify(journal));
  const oldPath = join(directory, "old.sqlite"); const old = openStore(oldPath, oldFolder); connections.push(old);
  const admin = store.raw.prepare("SELECT username,password_hash,created_at FROM admins").get() as { username: string; password_hash: string; created_at: number };
  old.raw.prepare("INSERT INTO admins(id,username,password_hash,created_at) VALUES(1,?,?,?)").run(admin.username, admin.password_hash, admin.created_at);
  for (const device of service.listDevices()) old.raw.prepare("INSERT INTO devices(id,name,room,type,adapter,capabilities,enabled,last_test_at) VALUES(?,?,?,?,?,?,?,?)").run(device.id, device.name, device.room, device.type, device.adapter, JSON.stringify(device.capabilities), 1, null);
  const token = await auth.login(credentials); const session = store.raw.prepare("SELECT token_hash,admin_id,expires_at FROM sessions").get() as { token_hash: string; admin_id: number; expires_at: number };
  old.raw.prepare("INSERT INTO sessions(token_hash,admin_id,expires_at) VALUES(?,?,?)").run(session.token_hash, session.admin_id, session.expires_at); old.close();
  const upgraded = openStore(oldPath); connections.push(upgraded); const upgradedAuth = createAuth(upgraded, undefined, () => clock);
  expect(upgradedAuth.session(token)?.username).toBe(credentials.username); expect(upgradedAuth.listDevices(token)).toHaveLength(3);
  expect(upgradedAuth.listDevices(token).every(device => device.mockBehavior === "accept")).toBe(true);
  expect(upgraded.raw.prepare("SELECT count(*) AS count FROM __drizzle_migrations").get()).toEqual({ count: 3 });
  const queue = createMessaging(upgraded, { clock: () => clock }); const id = queue.submit(1, input); await queue.processDue(); expect(queue.detail(id).deliveries.every(target => target.state === "accepted")).toBe(true);
 });
});

describe("messaging authorization and CSRF", () => {
 it.each([["devices", "GET"], ["devices", "POST"], ["devices", "PATCH"], ["devices", "DELETE"], ["messages", "GET"], ["messages", "POST"]] as const)("rejects unauthenticated %s %s", async (resource, method) => {
  const handlers = createMessagingHandlers(auth, service, origin); const request = method === "GET" ? new Request(origin + "/api/" + resource) : post("/api/" + resource, {}, undefined, method);
  expect((await handlers.handle(request, resource, method === "PATCH" || method === "DELETE" ? "mock-tv" : undefined)).status).toBe(401);
 });
 it("supports protected CRUD/queue/history with no-store responses and rejects foreign origins", async () => {
  const token = await auth.login(credentials); const handlers = createMessagingHandlers(auth, service, origin);
  const blocked = await handlers.handle(post("/api/messages", input, token, "POST", { origin: "https://attacker.example" }), "messages"); expect(blocked.status).toBe(403);
  const response = await handlers.handle(post("/api/messages", input, token), "messages"); expect(response.status).toBe(202); const id = (await response.json()).id;
  const read = await handlers.handle(new Request(origin + "/api/messages/" + id, { headers: { cookie: `hnh_session=${token}` } }), "messages", id);
  expect(read.status).toBe(200); expect(read.headers.get("cache-control")).toBe("no-store"); expect((await read.json()).message.deliveries).toHaveLength(2);
  const huge = await handlers.handle(post("/api/messages", { body: "a".repeat(17000) }, token), "messages"); expect(huge.status).toBe(413);
 });
 it("requires authorization and origin on test/resend and clears no history on device removal", async () => {
  const handlers = createMessagingHandlers(auth, service, origin); expect((await handlers.handle(post("/api/devices/mock-tv/test", {}), "devices", "mock-tv", "test")).status).toBe(401);
  const token = await auth.login(credentials); const id = service.submit(1, input);
  expect((await handlers.handle(post("/api/messages/x/resend", {}, token, "POST", { origin: "null" }), "messages", id, "resend")).status).toBe(403);
  expect((await handlers.handle(post("/api/devices/mock-tv", {}, token, "DELETE"), "devices", "mock-tv")).status).toBe(204);
  expect(service.detail(id).deliveries.find(target => target.deviceName === "Family TV")?.deviceId).toBeNull();
 });
});
