import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { z } from "zod";
import type { HomeAssistantConfig } from "./config";
import type { DiscoveredTarget, HomeAssistantTarget } from "../../lib/home-assistant";
import { broadcastRooms, notifyService, profileId, profilesSchema, tvPresentation } from "./profiles";
export type HomeAssistantErrorCode = "ha_auth" | "ha_unavailable" | "ha_configuration" | "ha_response" | "ha_rejected" | "ha_timeout" | "ha_outcome_unknown";
export class HomeAssistantError extends Error { constructor(public code: HomeAssistantErrorCode, public retryable = false) { super(code); } }
export const MAX_HA_RESPONSE = 2 * 1024 * 1024;
export type HomeAssistantTransport = (path: string, body: Record<string, unknown> | undefined, signal: AbortSignal) => Promise<unknown>;
const entity = z.string().regex(/^(notify|tts|media_player)\.[a-z0-9_]{1,128}$/);
export const targetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("notify_service"), service: notifyService, supportsTitle: z.boolean() }).strict(),
  z.object({ kind: z.literal("notify_entity"), entityId: entity.refine(value => value.startsWith("notify.")), supportsTitle: z.boolean().optional() }).strict(),
  z.object({ kind: z.literal("android_tv"), profileId, service: notifyService, supportsTitle: z.boolean(), presentation: tvPresentation }).strict(),
  z.object({ kind: z.literal("browser_push"), profileId, browser: z.string().regex(/^[a-z0-9_]{1,128}$/), supportsTitle: z.boolean() }).strict(),
  z.object({ kind: z.literal("google_broadcast"), profileId, rooms: broadcastRooms }).strict(),
  z.object({ kind: z.literal("tts"), entityId: entity.refine(value => value.startsWith("media_player.")), ttsEntityId: entity.refine(value => value.startsWith("tts.")) }).strict(),
]);
export function createTransport(config: HomeAssistantConfig): HomeAssistantTransport {
  return (path, body, signal) => new Promise((resolve, reject) => {
    // This is a second path guard. No caller-provided URL, hostname, query or redirect is used.
    if (!(body === undefined ? /^\/api\/(services|states)$/.test(path) : /^\/api\/services\/(notify\/[a-z0-9_]{1,128}|tts\/speak)$/.test(path))) { reject(new HomeAssistantError("ha_configuration")); return; }
    const payload = body === undefined ? undefined : JSON.stringify(body);
    let settled = false;
    const finish = (error?: HomeAssistantError, value?: unknown) => { if (settled) return; settled = true; if (error) reject(error); else resolve(value); };
    const logicalHost = config.origin.hostname.replace(/^\[|\]$/g, "");
    const combined = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
    const request = (config.origin.protocol === "https:" ? httpsRequest : httpRequest)({
      protocol: config.origin.protocol, hostname: config.address, port: config.origin.port || (config.origin.protocol === "https:" ? 443 : 80),
      // Connect to the pinned IP without DNS; TLS still verifies the logical hostname.
      ...(config.origin.protocol === "https:" ? { rejectUnauthorized: true, ...(!isIP(logicalHost) ? { servername: logicalHost } : {}) } : {}),
      method: payload === undefined ? "GET" : "POST", path, agent: false, signal: combined,
      headers: { Host: config.origin.host, Authorization: `Bearer ${config.token}`, Accept: "application/json", ...(payload === undefined ? {} : { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }) },
    }, response => {
      const status = response.statusCode ?? 0;
      if (status < 200 || status >= 300) {
        // Never return response bodies (which may echo credentials), or follow redirects.
        finish(new HomeAssistantError(status === 401 || status === 403 ? "ha_auth" : status >= 300 && status < 400 ? "ha_configuration" : status >= 500 && payload !== undefined ? "ha_outcome_unknown" : status === 429 || status >= 500 ? "ha_unavailable" : "ha_rejected", status === 429 || (status >= 500 && payload === undefined)));
        response.destroy();
        return;
      }
      const chunks: Buffer[] = []; let length = 0;
      response.on("data", (chunk: Buffer) => { length += chunk.length; if (length > MAX_HA_RESPONSE) { finish(new HomeAssistantError(payload === undefined ? "ha_response" : "ha_outcome_unknown")); request.destroy(); } else chunks.push(chunk); });
      response.on("aborted", () => finish(new HomeAssistantError(payload === undefined ? "ha_unavailable" : "ha_outcome_unknown", payload === undefined)));
      response.on("error", () => finish(new HomeAssistantError(payload === undefined ? "ha_unavailable" : "ha_outcome_unknown", payload === undefined)));
      response.on("end", () => {
        try { finish(undefined, JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
        catch { finish(new HomeAssistantError(payload === undefined ? "ha_response" : "ha_outcome_unknown")); }
      });
    });
    request.on("error", () => finish(new HomeAssistantError(payload !== undefined ? "ha_outcome_unknown" : combined.aborted ? "ha_timeout" : "ha_unavailable", payload === undefined)));
    if (payload !== undefined) request.write(payload);
    request.end();
  });
}
const servicesSchema = z.array(z.object({ domain: z.string(), services: z.record(z.string(), z.object({ fields: z.record(z.string(), z.unknown()).optional().default({}) })) })).max(1000);
const statesSchema = z.array(z.object({ entity_id: z.string(), state: z.string(), attributes: z.object({ friendly_name: z.string().optional(), supported_features: z.number().optional() }).optional().default({}) })).max(10000);
export function createHomeAssistantClient(config: HomeAssistantConfig, transport = createTransport(config)) {
  const profiles = profilesSchema.parse(config.profiles ?? []);
  const cleanName = (value: string) => value.replaceAll(config.token, "[redacted]").replace(/[\x00-\x1f\x7f]/g, " ").slice(0, 80) || "Home Assistant target";
  async function discover(signal = AbortSignal.timeout(8000)): Promise<DiscoveredTarget[]> {
    try {
      const [servicesInput, statesInput] = await Promise.all([transport("/api/services", undefined, signal), transport("/api/states", undefined, signal)]);
      const services = servicesSchema.parse(servicesInput), states = statesSchema.parse(statesInput);
      const notify = services.find(item => item.domain === "notify")?.services ?? {};
      const targets: DiscoveredTarget[] = [];
      for (const profile of profiles) {
        if (profile.kind === "android_tv") {
          const metadata = notify[profile.service];
          if (!metadata || !("message" in metadata.fields) || !("data" in metadata.fields)) continue;
          targets.push({ id: `profile:${profile.id}`, name: cleanName(profile.name), capabilities: ["overlay", "text"], type: "tv", reportedUnavailable: false, target: { kind: "android_tv", profileId: profile.id, service: profile.service, supportsTitle: "title" in metadata.fields, presentation: profile.presentation } });
        } else if (profile.kind === "browser_push") {
          const metadata = notify.html5;
          if (metadata && "message" in metadata.fields && "target" in metadata.fields) targets.push({ id: `profile:${profile.id}`, name: cleanName(profile.name), capabilities: ["text"], type: "computer", reportedUnavailable: false, target: { kind: "browser_push", profileId: profile.id, browser: profile.browser, supportsTitle: "title" in metadata.fields } });
        } else if (notify.google_assistant_sdk && "message" in notify.google_assistant_sdk.fields && "target" in notify.google_assistant_sdk.fields) {
          targets.push({ id: `profile:${profile.id}`, name: cleanName(profile.name), capabilities: ["speech"], type: "speaker", reportedUnavailable: false, target: { kind: "google_broadcast", profileId: profile.id, rooms: profile.rooms } });
        }
      }
      for (const [service, metadata] of Object.entries(notify)) {
        if (!notifyService.safeParse(service).success || profiles.some(profile => profile.kind === "android_tv" && profile.service === service) || !("message" in metadata.fields)) continue;
        targets.push({ id: `notify-service:${service}`, name: cleanName(service.replaceAll("_", " ")), capabilities: ["text"], type: service.startsWith("mobile_app_") ? "phone" : "computer", reportedUnavailable: false, target: { kind: "notify_service", service, supportsTitle: "title" in metadata.fields } });
      }
      if (notify.send_message && "message" in notify.send_message.fields) for (const state of states) {
        if (!/^notify\.[a-z0-9_]{1,128}$/.test(state.entity_id)) continue;
        targets.push({ id: `notify-entity:${state.entity_id}`, name: cleanName(state.attributes.friendly_name ?? state.entity_id), capabilities: ["text"], type: "computer", reportedUnavailable: state.state === "unavailable", target: { kind: "notify_entity", entityId: state.entity_id, ...((state.attributes.supported_features ?? 0) & 1 ? { supportsTitle: true } : {}) } });
      }
      if (services.some(item => item.domain === "tts" && item.services.speak)) {
        const providers = states.filter(state => /^tts\.[a-z0-9_]{1,128}$/.test(state.entity_id));
        const players = states.filter(state => /^media_player\.[a-z0-9_]{1,128}$/.test(state.entity_id) && ((state.attributes.supported_features ?? 0) & 512) !== 0);
        for (const player of players) for (const provider of providers) {
          if (targets.length >= 500) break;
          targets.push({ id: `tts:${provider.entity_id}:${player.entity_id}`, name: cleanName(`${player.attributes.friendly_name ?? player.entity_id} (${provider.attributes.friendly_name ?? provider.entity_id})`), capabilities: ["speech"], type: "speaker", reportedUnavailable: player.state === "unavailable" || provider.state === "unavailable", target: { kind: "tts", entityId: player.entity_id, ttsEntityId: provider.entity_id } });
        }
      }
      return targets.slice(0, 500);
    } catch (error) { if (error instanceof HomeAssistantError) throw error; throw new HomeAssistantError("ha_response"); }
  }
  async function send(target: HomeAssistantTarget, title: string, body: string, signal: AbortSignal) {
    const parsed = targetSchema.safeParse(target); if (!parsed.success) throw new HomeAssistantError("ha_configuration");
    const recipe = parsed.data;
    if (recipe.kind === "android_tv" || recipe.kind === "google_broadcast" || recipe.kind === "browser_push") {
      const profile = profiles.find(item => item.id === recipe.profileId);
      if (!profile || profile.kind !== recipe.kind || (recipe.kind === "android_tv"
        ? profile.kind !== "android_tv" || profile.service !== recipe.service || JSON.stringify(profile.presentation) !== JSON.stringify(recipe.presentation)
        : recipe.kind === "browser_push" ? profile.kind !== "browser_push" || profile.browser !== recipe.browser
        : profile.kind !== "google_broadcast" || JSON.stringify(profile.rooms) !== JSON.stringify(recipe.rooms))) throw new HomeAssistantError("ha_configuration");
    }
    const text = title ? `${title}\n${body}` : body;
    let path: string, payload: Record<string, unknown>;
    switch (recipe.kind) {
      case "notify_service":
        path = `/api/services/notify/${recipe.service}`; payload = recipe.supportsTitle ? { title, message: body } : { message: text }; break;
      case "notify_entity":
        path = "/api/services/notify/send_message"; payload = recipe.supportsTitle ? { entity_id: recipe.entityId, title, message: body } : { entity_id: recipe.entityId, message: text }; break;
      case "android_tv":
        path = `/api/services/notify/${recipe.service}`; payload = { ...(recipe.supportsTitle ? { title, message: body } : { message: text }), data: { ...recipe.presentation, interrupt: false } }; break;
      case "browser_push":
        path = "/api/services/notify/html5"; payload = { ...(recipe.supportsTitle ? { title, message: body } : { message: text }), target: [recipe.browser] }; break;
      case "google_broadcast":
        path = "/api/services/notify/google_assistant_sdk"; payload = { message: text, target: recipe.rooms }; break;
      case "tts":
        path = "/api/services/tts/speak"; payload = { entity_id: recipe.ttsEntityId, media_player_entity_id: recipe.entityId, message: text, cache: true }; break;
    }
    const result = await transport(path, payload, signal);
    if (!Array.isArray(result)) throw new HomeAssistantError("ha_outcome_unknown");
    return result;
  }
  return { discover, send };
}
export type HomeAssistantClient = ReturnType<typeof createHomeAssistantClient>;
