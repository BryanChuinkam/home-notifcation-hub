import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseProfiles } from "../../src/server/home-assistant/profiles";
import { homeAssistantConfiguration, type HomeAssistantConfig } from "../../src/server/home-assistant/config";
import { createHomeAssistantClient, targetSchema } from "../../src/server/home-assistant/client";
import { homeAssistantAdapter } from "../../src/server/home-assistant/adapter";
import { openStore } from "../../src/server/db/store";
import { createMessaging, LEASE_MS } from "../../src/server/notifications/service";
import { createAuth } from "../../src/server/auth/service";
import type { DeliveryResult } from "../../src/server/notifications/types";
const token = "unit-only-synthetic-token-not-a-household-secret";
const profiles = parseProfiles(JSON.stringify([
  { id: "tv", name: "Living room TV", kind: "android_tv", service: "living_room_tv" },
  { id: "rooms", name: "Downstairs announcement", kind: "google_broadcast", rooms: ["kitchen", "living room"] },
  { id: "browser", name: "Chrome", kind: "browser_push", browser: "office_chrome" },
]));
const config: HomeAssistantConfig = { origin: new URL("http://fixture.test:8123"), address: "127.0.0.1", token, profiles };
const services = [{ domain: "notify", services: {
  living_room_tv: { fields: { message: {}, title: {}, data: {} } },
  google_assistant_sdk: { fields: { message: {}, target: {} } },
  html5: { fields: { message: {}, title: {}, target: {} } },
  mobile_app_iphone: { fields: { message: {}, title: {} } },
  send_message: { fields: { message: {}, title: {} } },
} }];
const states = [{ entity_id: "notify.modern_tv", state: "unknown", attributes: { friendly_name: "Modern TV", supported_features: 1 } }];
const calls: { path: string; body: Record<string, unknown> | undefined }[] = [];
function client(settings = config) { return createHomeAssistantClient(settings, async (path, body) => { calls.push({ path, body }); return path === "/api/services" ? services : path === "/api/states" ? states : []; }); }
afterEach(() => { calls.length = 0; });

describe("explicit operator device profiles", () => {
  it("allows an empty configuration and bounds presentation without arbitrary payloads", () => {
    expect(parseProfiles("")).toEqual([]); expect(profiles[0]).toMatchObject({ presentation: { duration: 10, position: "bottom-right" } });
    const env = { HOME_ASSISTANT_URL: "http://127.0.0.1:8123", HOME_ASSISTANT_TOKEN: token, HOME_ASSISTANT_DEVICE_PROFILES: "not-json" };
    const result = homeAssistantConfiguration(env); expect(result.config).toBeNull(); expect(JSON.stringify(result.status)).not.toContain(token); expect(JSON.stringify(result.status)).not.toContain("not-json");
    expect(homeAssistantConfiguration({ ...env, HOME_ASSISTANT_DEVICE_PROFILES: JSON.stringify(profiles) }).config?.profiles).toEqual(profiles);
  });
  it.each([
    [{ id: "web", name: "Web", kind: "browser_push", browser: "*" }],
    [{ id: "web", name: "Web", kind: "browser_push", browser: "office", url: "https://attacker.test" }],
    [{ id: "all", name: "All", kind: "google_broadcast", rooms: [] }],
    [{ id: "rooms", name: "Rooms", kind: "google_broadcast", rooms: ["kitchen", "Kitchen"] }],
    [{ id: "rooms", name: "Rooms", kind: "google_broadcast", rooms: ["kitchen\nother command"] }],
    [{ id: "tv", name: "TV", kind: "android_tv", service: "notify" }],
    [{ id: "tv", name: "TV", kind: "android_tv", service: "tv", presentation: { duration: 61 } }],
    [{ id: "tv", name: "TV", kind: "android_tv", service: "tv", presentation: { image: "http://attacker.test" } }],
    [{ id: "tv", name: "TV", kind: "android_tv", service: "tv", url: "http://attacker.test" }],
    [{ id: "tv", name: "TV", kind: "android_tv", service: "tv" }, { id: "tv", name: "Other", kind: "google_broadcast", rooms: ["kitchen"] }],
    [{ id: "tv", name: "TV", kind: "android_tv", service: "tv" }, { id: "tv2", name: "Other", kind: "android_tv", service: "tv" }],
  ])("rejects unsafe, duplicate or untargeted profiles %j", (...items) => { expect(() => parseProfiles(JSON.stringify(items))).toThrow(); });
  it("discovers profiles only when required actions/fields exist, with explicit mode semantics", async () => {
    const found = await client().discover();
    expect(found.find(item => item.id === "profile:tv")).toMatchObject({ type: "tv", capabilities: ["overlay", "text"] });
    expect(found.find(item => item.id === "profile:rooms")).toMatchObject({ type: "speaker", capabilities: ["speech"] });
    expect(found.find(item => item.id === "notify-service:mobile_app_iphone")?.type).toBe("phone");
    expect(found.find(item => item.id === "profile:browser")).toMatchObject({ type: "computer", capabilities: ["text"] });
    expect(found.some(item => item.id === "notify-service:living_room_tv")).toBe(false);
    expect(found.some(item => item.id.includes("html5") || item.id.includes("google_assistant_sdk"))).toBe(false);
    expect(calls.every(call => call.body === undefined)).toBe(true);
    const missing = createHomeAssistantClient(config, async path => path === "/api/services" ? [{ domain: "notify", services: { living_room_tv: { fields: { message: {} } } } }] : states);
    expect((await missing.discover()).some(item => item.id.startsWith("profile:"))).toBe(false);
  });
  it("never treats SDK Broadcast or HTML5 as an individual generic text receiver", async () => {
    expect((await client({ ...config, profiles: [] }).discover()).some(item => item.id.includes("google_assistant_sdk") || item.id.includes("html5"))).toBe(false);
    for (const service of ["google_assistant_sdk", "html5"]) {
      expect(targetSchema.safeParse({ kind: "notify_service", service, supportsTitle: false }).success).toBe(false);
      await expect(client().send({ kind: "notify_service", service, supportsTitle: false }, "", "body", AbortSignal.timeout(1000))).rejects.toMatchObject({ code: "ha_configuration" });
    }
    expect(calls.filter(call => call.body !== undefined)).toEqual([]);
  });
  it("maps explicit room targets and bounded TV appearance into precise HA requests", async () => {
    const api = client(); const found = await api.discover(); calls.length = 0;
    await api.send(found.find(item => item.id === "profile:rooms")!.target, "Dinner", "Ready", AbortSignal.timeout(1000));
    await api.send(found.find(item => item.id === "profile:tv")!.target, "Dinner", "Ready", AbortSignal.timeout(1000));
    await api.send(found.find(item => item.id === "profile:browser")!.target, "Dinner", "Ready", AbortSignal.timeout(1000));
    expect(calls).toEqual([
      { path: "/api/services/notify/google_assistant_sdk", body: { message: "Dinner\nReady", target: ["kitchen", "living room"] } },
      { path: "/api/services/notify/living_room_tv", body: { title: "Dinner", message: "Ready", data: { duration: 10, position: "bottom-right", fontsize: "medium", color: "grey", transparency: "25%", interrupt: false } } },
      { path: "/api/services/notify/html5", body: { title: "Dinner", message: "Ready", target: ["office_chrome"] } },
    ]);
  });
  it("keeps native titles only for modern entities advertising TITLE, with old recipes compatible", async () => {
    const api = client(); const modern = (await api.discover()).find(item => item.id === "notify-entity:notify.modern_tv")!; calls.length = 0;
    await api.send(modern.target, "Dinner", "Ready", AbortSignal.timeout(1000));
    await api.send({ kind: "notify_entity", entityId: "notify.modern_tv" }, "Dinner", "Ready", AbortSignal.timeout(1000));
    expect(calls.map(call => call.body)).toEqual([{ entity_id: "notify.modern_tv", title: "Dinner", message: "Ready" }, { entity_id: "notify.modern_tv", message: "Dinner\nReady" }]);
  });
  it("fails closed before POST when a stored profile is removed or retargeted", async () => {
    const stored = (await client().discover()).filter(item => item.id.startsWith("profile:")); calls.length = 0;
    for (const item of stored) await expect(client({ ...config, profiles: [] }).send(item.target, "", "test", AbortSignal.timeout(1000))).rejects.toMatchObject({ code: "ha_configuration" });
    const changed = parseProfiles(JSON.stringify([{ id: "rooms", name: "Rooms", kind: "google_broadcast", rooms: ["upstairs"] }, { id: "tv", name: "TV", kind: "android_tv", service: "different_tv" }]));
    for (const item of stored) await expect(client({ ...config, profiles: changed }).send(item.target, "", "test", AbortSignal.timeout(1000))).rejects.toMatchObject({ code: "ha_configuration" });
    expect(calls).toEqual([]);
  });
});

it("does not repeat a real send after worker lease expiry and fences its late result", async () => {
  const directory = mkdtempSync(join(tmpdir(), "hnh-real-recovery-")); const store = openStore(join(directory, "hub.sqlite"));
  try {
    await createAuth(store, "unit-setup-secret-with-enough-length-12345").setup({ username: "owner", password: "unit-test-password-123", secret: "unit-setup-secret-with-enough-length-12345" });
    let clock = Date.now(), release!: (value: DeliveryResult) => void, sends = 0;
    const slowAdapter = { ...homeAssistantAdapter(client()), send: async () => { sends++; return new Promise<DeliveryResult>(resolve => { release = resolve; }); } };
    const queue = createMessaging(store, { clock: () => clock, adapters: [slowAdapter] });
    const target = (await client().discover()).find(item => item.id === "profile:tv")!;
    const device = queue.registerHomeAssistant(target, { name: "TV", room: "Room", type: "tv" });
    const id = queue.testDevice(1, device.id); expect(queue.detail(id).mode).toBe("overlay");
    const pending = queue.processOne(); await Promise.resolve(); await Promise.resolve(); expect(sends).toBe(1);
    clock += LEASE_MS + 1;
    const recovered = createMessaging(store, { clock: () => clock, adapters: [slowAdapter] }); expect(await recovered.processOne()).toBe(false);
    release({ ok: true, state: "dispatched", simulated: false }); await pending;
    const delivery = recovered.detail(id).deliveries[0]; expect(delivery).toMatchObject({ state: "failed", errorCode: "ha_outcome_unknown", simulated: false });
    expect(delivery.attempts).toHaveLength(1); expect(delivery.attempts[0].state).toBe("interrupted"); expect(sends).toBe(1);
    recovered.confirmObservation(1, id, { deliveryId: delivery.id, observation: "displayed" }); expect(recovered.detail(id).deliveries[0].state).toBe("failed");
    // Pending work using a removed profile also fails without a physical call.
    const next = queue.testDevice(1, device.id);
    const removed = createMessaging(store, { clock: () => clock, adapters: [homeAssistantAdapter(client({ ...config, profiles: [] }))] });
    await removed.processOne(); expect(removed.detail(next).deliveries[0].errorCode).toBe("ha_configuration");
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});
