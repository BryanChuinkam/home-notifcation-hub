// Owned loopback-only HA double. Never imported by application/runtime code.
import { createServer } from "node:http";
import { HA_FIXTURE_TOKEN } from "./home-assistant-token";
const services = [{ domain: "notify", services: { send_message: { fields: { message: {} } }, mobile_app_fixture: { fields: { message: {}, title: {} } } } }, { domain: "tts", services: { speak: { fields: { message: {}, media_player_entity_id: {} } } } }];
const states = [{ entity_id: "notify.office", state: "unknown", attributes: { friendly_name: "Office phone" } }, { entity_id: "tts.piper", state: "unknown", attributes: { friendly_name: "Piper" } }, { entity_id: "media_player.living_room", state: "idle", attributes: { friendly_name: "Living room", supported_features: 512 } }];
const requests: { path: string; body: Record<string, unknown> }[] = [];
const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.url === "/__hnh_fixture_health" && request.method === "GET") { response.end(JSON.stringify({ fixture: "home-notification-hub" })); return; }
  if (request.headers.authorization !== `Bearer ${HA_FIXTURE_TOKEN}`) { response.writeHead(401).end("{}"); return; }
  if (request.method === "GET" && request.url === "/api/services") { response.end(JSON.stringify(services)); return; }
  if (request.method === "GET" && request.url === "/api/states") { response.end(JSON.stringify(states)); return; }
  if (request.method === "GET" && request.url === "/__hnh_fixture_requests") { response.end(JSON.stringify(requests)); return; }
  if (request.method !== "POST" || !["/api/services/notify/send_message", "/api/services/notify/mobile_app_fixture", "/api/services/tts/speak"].includes(request.url ?? "")) { response.writeHead(404).end("{}"); return; }
  let body = "";
  for await (const chunk of request) { body += String(chunk); if (body.length > 16384) { response.writeHead(413).end("{}"); return; } }
  try { requests.push({ path: request.url!, body: JSON.parse(body) }); response.end("[]"); } catch { response.writeHead(400).end("{}"); }
});
// Binding fails if an existing HA service owns this port; there is no fallback/reuse.
server.listen(8123, "127.0.0.1");
for (const signal of ["SIGTERM", "SIGINT"] as const) process.on(signal, () => { server.closeAllConnections(); server.close(() => process.exit(0)); });
