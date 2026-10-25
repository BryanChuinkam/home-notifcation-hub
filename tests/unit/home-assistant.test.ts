import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer, type Server, type RequestListener } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync, rmSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { approvedAddress, homeAssistantConfiguration, type HomeAssistantConfig } from "../../src/server/home-assistant/config";
import { createHomeAssistantClient, createTransport, HomeAssistantError, MAX_HA_RESPONSE, type HomeAssistantTransport } from "../../src/server/home-assistant/client";
import { homeAssistantAdapter } from "../../src/server/home-assistant/adapter";
import { homeAssistantHandlers } from "../../src/server/home-assistant/http";
import { mockAdapter } from "../../src/server/notifications/mock";
import { createMessaging } from "../../src/server/notifications/service";
import { createMessagingHandlers } from "../../src/server/notifications/http";
import { createAuth } from "../../src/server/auth/service";
import { openStore, type Store } from "../../src/server/db/store";
const token = "synthetic-ha-token-never-a-live-credential";
const config: HomeAssistantConfig = { origin: new URL("http://ha.test:8123"), address: "127.0.0.1", token };
const services = [
 { domain: "notify", services: { mobile_app_phone: { fields: { message: {}, title: {} } }, simple_phone: { fields: { message: {} } }, notify: { fields: { message: {} } }, reload: { fields: {} }, send_message: { fields: { message: {} } } } },
 { domain: "tts", services: { speak: { fields: { message: {}, media_player_entity_id: {} } } } },
 { domain: "light", services: { turn_on: { fields: {} } } },
];
const states = [
 { entity_id: "notify.office", state: "unknown", attributes: { friendly_name: "Office phone" } },
 { entity_id: "notify.offline", state: "unavailable", attributes: { friendly_name: "Offline phone" } },
 { entity_id: "tts.piper", state: "unknown", attributes: { friendly_name: "Piper" } },
 { entity_id: "media_player.living_room", state: "idle", attributes: { friendly_name: "Living room", supported_features: 512 } },
 { entity_id: "media_player.no_playback", state: "idle", attributes: { supported_features: 1 } },
 { entity_id: "sensor.temperature", state: "20", attributes: { secret: token } },
];
const fixtureTransport: HomeAssistantTransport = async path => path === "/api/services" ? services : path === "/api/states" ? states : [];
const client = () => createHomeAssistantClient(config, fixtureTransport);
let directory: string, store: Store, auth: ReturnType<typeof createAuth>, queue: ReturnType<typeof createMessaging>;
const stores: Store[] = [], servers: Server[] = [];
const credentials = { username: "household", password: "fixture-only-password-123" };
beforeEach(async () => {
 directory = mkdtempSync(join(tmpdir(), "hnh-ha-test-")); store = openStore(join(directory, "hub.sqlite")); stores.push(store);
 auth = createAuth(store, "unit-only-initial-setup-secret-not-for-live-use"); await auth.setup({ ...credentials, secret: "unit-only-initial-setup-secret-not-for-live-use" });
 queue = createMessaging(store, { adapters: [mockAdapter, homeAssistantAdapter(client())] });
});
afterEach(async () => { for (const server of servers.splice(0)) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } for (const connection of stores.splice(0)) if (connection.raw.open) connection.close(); rmSync(directory, { recursive: true, force: true }); });
async function notifyTarget() { return (await client().discover()).find(target => target.id === "notify-entity:notify.office")!; }
async function registered() { return queue.registerHomeAssistant(await notifyTarget(), { name: "Office", room: "Study", type: "phone" }); }
async function login() { return auth.login(credentials); }
function request(path: string, session?: string, data: unknown = {}, origin = "http://127.0.0.1:3000") { return new Request("http://127.0.0.1:3000" + path, { method: "POST", headers: { origin, "content-type": "application/json", ...(session ? { cookie: `hnh_session=${session}` } : {}) }, body: JSON.stringify(data) }); }

describe("operator-owned HA network configuration", () => {
 it.each(["10.0.0.5", "172.16.1.2", "172.31.4.5", "192.168.1.20", "127.0.0.1", "fd00::1", "::1"])("allows pinned private/loopback address %s", address => { expect(approvedAddress(address)).toBe(true); });
 it.each(["8.8.8.8", "169.254.169.254", "100.100.100.200", "224.0.0.1", "0.0.0.0", "10.0.0.0", "192.168.1.255", "::", "fe80::1", "ff02::1", "::ffff:127.0.0.1", "2001:4860:4860::8888", "ha.local"])("rejects %s", address => { expect(approvedAddress(address)).toBe(false); });
 it("requires explicit address pinning for hostnames and never exposes tokens in status", () => {
  const env = { HOME_ASSISTANT_URL: "http://ha.test:8123", HOME_ASSISTANT_TOKEN: token };
  expect(homeAssistantConfiguration(env).config).toBeNull(); const result = homeAssistantConfiguration({ ...env, HOME_ASSISTANT_ADDRESS: "192.168.1.20" }); expect(result.config?.address).toBe("192.168.1.20"); expect(homeAssistantConfiguration({ ...env, HOME_ASSISTANT_URL: "http://ha.test:80", HOME_ASSISTANT_ADDRESS: "192.168.1.20" }).status.configured).toBe(true); expect(JSON.stringify(result.status)).not.toContain(token);
  expect(homeAssistantConfiguration({ HOME_ASSISTANT_URL: "http://192.168.1.20:8123", HOME_ASSISTANT_TOKEN: token }).status.configured).toBe(true);
 });
 it.each(["http://user:pass@ha.test:8123", "http://ha.test:8123/path", "http://ha.test:8123?redirect=1", "http://ha.test:8123/#fragment", "ftp://ha.test:8123", "http://ha.test:22", "https://ha.test:8443", "http://169.254.169.254:8123"])("rejects unsafe origin %s", value => { expect(homeAssistantConfiguration({ HOME_ASSISTANT_URL: value, HOME_ASSISTANT_TOKEN: token, HOME_ASSISTANT_ADDRESS: "192.168.1.20" }).config).toBeNull(); });
 it("rejects IP mismatches, partial config and live CI config", () => {
  expect(homeAssistantConfiguration({ HOME_ASSISTANT_URL: "http://192.168.1.20:8123", HOME_ASSISTANT_ADDRESS: "192.168.1.21", HOME_ASSISTANT_TOKEN: token }).config).toBeNull();
  expect(homeAssistantConfiguration({ HOME_ASSISTANT_URL: "http://ha.test:8123" }).status.configured).toBe(false);
  expect(homeAssistantConfiguration({ CI: "true", HOME_ASSISTANT_URL: "http://192.168.1.20:8123", HOME_ASSISTANT_TOKEN: token }).config).toBeNull();
 });
});

describe("read-only discovery and action mapping", () => {
 it("discovers targeted legacy notify, modern notify entities and playable TTS combinations conservatively", async () => {
  const targets = await client().discover(); expect(targets.map(target => target.id)).toEqual(["notify-service:mobile_app_phone", "notify-service:simple_phone", "notify-entity:notify.office", "notify-entity:notify.offline", "tts:tts.piper:media_player.living_room"]);
  expect(targets.every(target => !target.capabilities.includes("overlay" as "text"))).toBe(true); expect(targets.find(target => target.id.includes("offline"))?.reportedUnavailable).toBe(true); expect(JSON.stringify(targets)).not.toContain(token);
 });
 it("never sends while discovering or forwards unsupported raw state attributes", async () => {
  const paths: string[] = []; const discovered = createHomeAssistantClient(config, async (path, body, signal) => { expect(body).toBeUndefined(); paths.push(path); return fixtureTransport(path, body, signal); });
  const data = await discovered.discover(); expect(paths.sort()).toEqual(["/api/services", "/api/states"]); expect(JSON.stringify(data)).not.toContain("temperature");
 });
 it("maps text/title/entity/TTS into only allowlisted service paths and request fields", async () => {
  const calls: { path: string; body: unknown }[] = []; const mapped = createHomeAssistantClient(config, async (path, body) => { calls.push({ path, body }); return []; }); const signal = AbortSignal.timeout(1000);
  await mapped.send({ kind: "notify_service", service: "mobile_app_phone", supportsTitle: true }, "Dinner", "Ready", signal);
  await mapped.send({ kind: "notify_service", service: "simple_phone", supportsTitle: false }, "Dinner", "Ready", signal);
  await mapped.send({ kind: "notify_entity", entityId: "notify.office" }, "Dinner", "Ready", signal);
  await mapped.send({ kind: "tts", entityId: "media_player.living_room", ttsEntityId: "tts.piper" }, "", "Ready", signal);
  expect(calls).toEqual([{ path: "/api/services/notify/mobile_app_phone", body: { title: "Dinner", message: "Ready" } }, { path: "/api/services/notify/simple_phone", body: { message: "Dinner\nReady" } }, { path: "/api/services/notify/send_message", body: { entity_id: "notify.office", message: "Dinner\nReady" } }, { path: "/api/services/tts/speak", body: { entity_id: "tts.piper", media_player_entity_id: "media_player.living_room", message: "Ready", cache: true } }]);
 });
 it("rejects forged target paths and malformed discovery without reflecting provider data", async () => {
  await expect(client().send({ kind: "notify_service", service: "../light/turn_on", supportsTitle: false }, "", "x", AbortSignal.timeout(1000))).rejects.toMatchObject({ code: "ha_configuration" });
  await expect(createHomeAssistantClient(config, async () => ({ secret: token })).discover()).rejects.toMatchObject({ code: "ha_response" });
  const echo = createHomeAssistantClient(config, async path => path.endsWith("states") ? [{ entity_id: "notify.office", state: "unknown", attributes: { friendly_name: token } }] : services);
  expect(JSON.stringify(await echo.discover())).not.toContain(token);
 });
});

describe("real-code HTTP transport against an isolated loopback fixture", () => {
 async function fixture(handler: RequestListener) {
  const server = createServer(handler); servers.push(server); await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  // Trusted test construction bypasses the production config's fixed port policy solely for an owned ephemeral fixture.
  return { server, transport: createTransport({ origin: new URL(`http://unresolvable-ha-fixture.test:${(server.address() as AddressInfo).port}`), address: "127.0.0.1", token }) };
 }
 it("pins the socket address without DNS while retaining Host/auth headers", async () => {
  let observed: { host?: string; authorization?: string; url?: string } = {};
  const { transport } = await fixture((request, response) => { observed = { host: request.headers.host, authorization: request.headers.authorization, url: request.url }; response.setHeader("content-type", "application/json"); response.end("[]"); });
  expect(await transport("/api/services", undefined, AbortSignal.timeout(1000))).toEqual([]); expect(observed.host).toMatch(/^unresolvable-ha-fixture.test:/); expect(observed.authorization).toBe(`Bearer ${token}`); expect(observed.url).toBe("/api/services");
 });
 it("rejects redirects without contacting their destination or returning echoed credentials", async () => {
  let count = 0; const { transport } = await fixture((_request, response) => { count++; response.writeHead(302, { Location: "http://169.254.169.254/latest/meta-data" }); response.end(token); });
  await expect(transport("/api/services", undefined, AbortSignal.timeout(1000))).rejects.toMatchObject({ code: "ha_configuration", message: "ha_configuration" }); expect(count).toBe(1);
 });
 it.each([[401, "ha_auth", false], [403, "ha_auth", false], [404, "ha_rejected", false], [429, "ha_unavailable", true], [500, "ha_outcome_unknown", false]] as const)("maps POST HTTP %s safely", async (status, code, retryable) => {
  const { transport } = await fixture((_request, response) => { response.writeHead(status); response.end(token); });
  await expect(transport("/api/services/notify/mobile_app_phone", { message: "fixture" }, AbortSignal.timeout(1000))).rejects.toMatchObject({ code, retryable, message: code });
 });
 it("bounds response size and rejects malformed JSON", async () => {
  let oversized = true; const { transport } = await fixture((_request, response) => { response.end(oversized ? Buffer.alloc(MAX_HA_RESPONSE + 100, 120) : "not-json-" + token); });
  await expect(transport("/api/states", undefined, AbortSignal.timeout(1000))).rejects.toMatchObject({ code: "ha_response" }); oversized = false;
  await expect(transport("/api/states", undefined, AbortSignal.timeout(1000))).rejects.toMatchObject({ code: "ha_response", message: "ha_response" });
 });
 it("aborts hanging requests and never retries an ambiguous POST automatically", async () => {
  const { transport } = await fixture(() => {});
  await expect(transport("/api/services/notify/mobile_app_phone", { message: "fixture" }, AbortSignal.timeout(20))).rejects.toMatchObject({ code: "ha_outcome_unknown", retryable: false });
 });
 it("rejects arbitrary paths before opening a socket", async () => {
  let contacted = false; const { transport } = await fixture(() => { contacted = true; });
  await expect(transport("http://attacker.test", undefined, AbortSignal.timeout(100))).rejects.toMatchObject({ code: "ha_configuration" }); expect(contacted).toBe(false);
 });
});

describe("registration, dispatch and separate manual evidence", () => {
 it("registers exactly one discovered target, derives capabilities and locks adapter configuration", async () => {
  const target = await notifyTarget(); const device = await registered(); expect(device.adapter).toBe("home_assistant"); expect(device.capabilities).toEqual(["text"]); expect(device.lastTestAt).toBeNull();
  expect(() => queue.registerHomeAssistant(target, { name: "Duplicate", room: "Study", type: "phone" })).toThrow("already registered");
  expect(() => queue.editDevice(device.id, { haTarget: { kind: "notify_service", service: "notify" } })).toThrow(); expect(() => queue.editDevice(device.id, { capabilities: ["overlay"] })).toThrow();
  expect(queue.editDevice(device.id, { name: "Office phone", enabled: false })?.enabled).toBe(false);
 });
 it("records only real dispatch and never automatically changes physical test evidence", async () => {
  const device = await registered(), id = queue.testDevice(1, device.id); expect(queue.detail(id).deliveries[0].simulated).toBe(false);
  await queue.processDue(); const target = queue.detail(id).deliveries[0]; expect(target.state).toBe("dispatched"); expect(target.simulated).toBe(false); expect(target.confirmation).toBeNull(); expect(queue.getDevice(device.id).lastTestAt).toBeNull();
  queue.confirmObservation(1, id, { deliveryId: target.id, observation: "displayed" }); const confirmed = queue.detail(id).deliveries[0]; expect(confirmed.state).toBe("dispatched"); expect(confirmed.confirmation?.observer).toBe("household"); expect(queue.getDevice(device.id).lastTestAt).not.toBeNull();
  expect(() => queue.confirmObservation(1, id, { deliveryId: target.id, observation: "displayed" })).toThrow("already");
 });
 it("gives a resent real test a fresh physical verification code and no inherited evidence", async () => {
  const device = await registered(), first = queue.testDevice(1, device.id); await queue.processDue(); const original = queue.detail(first);
  queue.confirmObservation(1, first, { deliveryId: original.deliveries[0].id, observation: "displayed" });
  const second = queue.resend(1, first), resent = queue.detail(second);
  expect(resent.body).not.toBe(original.body); expect(resent.resendOf).toBe(first); expect(resent.deliveries[0].confirmation).toBeNull(); expect(resent.deliveries[0].state).toBe("queued");
 });
 it("rejects observation of mock, pending, ordinary-message or mismatched-mode deliveries", async () => {
  const mockId = queue.testDevice(1, "mock-tv"); await queue.processDue(); expect(() => queue.confirmObservation(1, mockId, { deliveryId: queue.detail(mockId).deliveries[0].id, observation: "displayed" })).toThrow();
  const device = await registered(), pending = queue.testDevice(1, device.id); expect(() => queue.confirmObservation(1, pending, { deliveryId: queue.detail(pending).deliveries[0].id, observation: "displayed" })).toThrow(); await queue.processDue();
  expect(() => queue.confirmObservation(1, pending, { deliveryId: queue.detail(pending).deliveries[0].id, observation: "spoken" })).toThrow("mode");
  const ordinary = queue.submit(1, { title: "", body: "Fixture", mode: "text", priority: "normal", recipients: [device.id] }); await queue.processDue(); expect(() => queue.confirmObservation(1, ordinary, { deliveryId: queue.detail(ordinary).deliveries[0].id, observation: "displayed" })).toThrow();
 });
 it("keeps HA failures real and stops automatic retries when POST outcome is unknown", async () => {
  const device = await registered(); let calls = 0; const failing = createMessaging(store, { adapters: [homeAssistantAdapter(createHomeAssistantClient(config, async () => { calls++; throw new HomeAssistantError("ha_outcome_unknown"); }))] });
  const id = failing.testDevice(1, device.id); await failing.processDue(); expect(await failing.processDue()).toBe(0); const target = failing.detail(id).deliveries[0]; expect(target.simulated).toBe(false); expect(target.errorCode).toBe("ha_outcome_unknown"); expect(calls).toBe(1);
  failing.confirmObservation(1, id, { deliveryId: target.id, observation: "displayed" }); expect(failing.detail(id).deliveries[0].state).toBe("failed"); expect(failing.detail(id).deliveries[0].confirmation).not.toBeNull();
 });
 it("fails closed when the HA configuration is removed, with no mock fallback", async () => {
  const device = await registered(); expect(() => createMessaging(store).submit(1, { title: "", body: "Fixture", mode: "text", priority: "normal", recipients: [device.id] })).toThrow("adapter");
 });
 it("persists credentials, history, queue, recipient IDs and attempts through original-table rebuild", async () => {
  const completed = queue.testDevice(1, "mock-tv"); await queue.processDue(); const queued = queue.submit(1, { title: "", body: "Persist me", mode: "text", priority: "normal", recipients: ["mock-tv"] });
  const session = await login(); const folder = join(directory, "v2-migrations"); cpSync("migrations", folder, { recursive: true }); const journalPath = join(folder, "meta", "_journal.json"); const journal = JSON.parse(readFileSync(journalPath, "utf8")); journal.entries = journal.entries.slice(0, 2); writeFileSync(journalPath, JSON.stringify(journal));
  const path = join(directory, "v2.sqlite"); const old = openStore(path, folder); stores.push(old);
  const tables: Record<string, string[]> = { admins: ["id","username","password_hash","created_at"], sessions: ["token_hash","admin_id","expires_at"], devices: ["id","name","room","type","adapter","capabilities","enabled","last_test_at","mock_behavior"], messages: ["id","sender_id","sender_name","title","body","mode","priority","kind","resend_of","created_at"], deliveries: ["id","message_id","device_id","device_name","adapter","state","attempt_count","next_attempt_at","lease_token","lease_until","created_at","attempted_at","completed_at","error_code","simulated"], delivery_attempts: ["id","delivery_id","number","started_at","completed_at","state","error_code"] };
  for (const [table, columns] of Object.entries(tables)) for (const row of store.raw.prepare(`SELECT ${columns.join(",")} FROM ${table}`).all() as Record<string, unknown>[]) old.raw.prepare(`INSERT INTO ${table}(${columns.join(",")}) VALUES(${columns.map(() => "?").join(",")})`).run(...columns.map(column => row[column])); old.close();
  const upgraded = openStore(path); stores.push(upgraded); expect(upgraded.raw.pragma("foreign_key_check")).toEqual([]); expect(createAuth(upgraded, undefined).session(session)?.username).toBe("household"); const restored = createMessaging(upgraded); expect(restored.detail(completed).deliveries[0].deviceId).toBe("mock-tv"); expect(restored.detail(completed).deliveries[0].attempts).toHaveLength(1); await restored.processDue(); expect(restored.detail(queued).deliveries[0].state).toBe("accepted");
 });
});

describe("protected integration endpoints", () => {
 it("requires session/origin, re-discovers registration and never sends a notification on discovery", async () => {
  const actions = homeAssistantHandlers(auth, queue, client(), { configured: true, message: "Configured" }, "http://127.0.0.1:3000");
  expect((await actions.handle(request("/discover"), "discover")).status).toBe(401); const session = await login();
  expect((await actions.handle(request("/discover", session, {}, "https://attacker.test"), "discover")).status).toBe(403);
  const found = await actions.handle(request("/discover", session), "discover"); expect(found.status).toBe(200); expect(JSON.stringify(await found.json())).not.toContain(token);
  const forged = await actions.handle(request("/register", session, { targetId: "notify-service:arbitrary", name: "Fake", room: "Study", type: "computer" }), "register"); expect(forged.status).toBe(422);
  const result = await actions.handle(request("/register", session, { targetId: "notify-entity:notify.office", name: "Phone", room: "Study", type: "phone" }), "register"); expect(result.status).toBe(201); expect((await result.json()).device.adapter).toBe("home_assistant");
  const injected = await actions.handle(request("/register", session, { targetId: "notify-entity:notify.office", name: "Phone", room: "Study", type: "phone", url: "http://169.254.169.254" }), "register"); expect(injected.status).toBe(422);
 });
 it("handles missing configuration and safe upstream authentication errors", async () => {
  const session = await login(); const absent = homeAssistantHandlers(auth, queue, null, { configured: false, message: "Configure the server" }, "http://127.0.0.1:3000"); expect((await absent.handle(request("/discover", session), "discover")).status).toBe(503);
  const rejected = homeAssistantHandlers(auth, queue, createHomeAssistantClient(config, async () => { throw new HomeAssistantError("ha_auth"); }), { configured: true, message: "Configured" }, "http://127.0.0.1:3000"); const response = await rejected.handle(request("/discover", session), "discover"); expect(response.status).toBe(502); expect(await response.text()).not.toContain(token);
 });
 it("requires authorization/origin before accepting physical observation", async () => {
  const device = await registered(), id = queue.testDevice(1, device.id); await queue.processDue(); const target = queue.detail(id).deliveries[0]; const handlers = createMessagingHandlers(auth, queue, "http://127.0.0.1:3000");
  expect((await handlers.handle(request("/confirm", undefined, { deliveryId: target.id, observation: "displayed" }), "messages", id, "confirm")).status).toBe(401); const session = await login();
  expect((await handlers.handle(request("/confirm", session, { deliveryId: target.id, observation: "displayed" }, "https://attacker.test"), "messages", id, "confirm")).status).toBe(403);
  expect((await handlers.handle(request("/confirm", session, { deliveryId: target.id, observation: "displayed" }), "messages", id, "confirm")).status).toBe(201);
 });
});
