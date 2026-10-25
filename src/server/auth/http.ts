import type { HubConfig } from "../config";
import { AuthError, SESSION_LIFETIME, type Auth } from "./service";
export const SESSION_COOKIE = "hnh_session";
export function requestToken(request: Request) {
  return request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
}
export function sessionCookie(token: string, secure: boolean, clear = false) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : SESSION_LIFETIME / 1000}${secure ? "; Secure" : ""}`;
}
export function failure(error: unknown) {
  const status = error instanceof AuthError ? error.status : 500;
  return Response.json({ error: error instanceof AuthError ? error.message : "The request could not be completed. Please try again." }, {
    status, headers: { "Cache-Control": "no-store", ...(error instanceof AuthError && error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) },
  });
}
function sameOrigin(request: Request, origin: string) {
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site") throw new AuthError(403, "This request must come from the dashboard's configured origin.");
}
async function readBody(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new AuthError(415, "Send a JSON request.");
  if (Number(request.headers.get("content-length")) > 4096) throw new AuthError(413, "The request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new AuthError(400, "A request body is required.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 4096) { await reader.cancel(); throw new AuthError(413, "The request is too large."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new AuthError(400, "The request contains invalid JSON."); }
}
export function createHandlers(auth: Auth, config: Pick<HubConfig, "origin" | "secureCookies">) {
  async function mutate(request: Request, operation: "setup" | "login" | "logout") {
    try {
      sameOrigin(request, config.origin);
      if (operation === "logout") {
        auth.logout(requestToken(request));
        return new Response(null, { status: 204, headers: { "Set-Cookie": sessionCookie("", config.secureCookies, true), "Cache-Control": "no-store" } });
      }
      const input = await readBody(request);
      if (operation === "setup") { await auth.setup(input); return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } }); }
      const token = await auth.login(input);
      return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(token, config.secureCookies), "Cache-Control": "no-store" } });
    } catch (error) { return failure(error); }
  }
  function getDevices(request: Request) {
    try { return Response.json({ devices: auth.listDevices(requestToken(request)) }, { headers: { "Cache-Control": "no-store" } }); }
    catch (error) { return failure(error); }
  }
  return { mutate, getDevices };
}
