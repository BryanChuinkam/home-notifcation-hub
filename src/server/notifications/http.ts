import { AuthError, type Auth } from "../auth/service";
import { failure, readBody, requestToken, sameOrigin } from "../auth/http";
import type { Messaging } from "./service";
export function createMessagingHandlers(auth: Auth, messaging: Messaging, origin: string) {
  async function handle(request: Request, resource: "devices" | "messages", id?: string, action?: "test" | "resend" | "confirm") {
    try {
      const admin = auth.session(requestToken(request));
      if (!admin) throw new AuthError(401, "Please sign in to continue.");
      const method = request.method;
      if (method !== "GET") sameOrigin(request, origin);
      let data: unknown; let status = 200;
      if (resource === "devices") {
        if (method === "GET" && !action) data = id ? { device: messaging.getDevice(id) } : { devices: messaging.listDevices() };
        else if (method === "POST" && !id) { data = { device: messaging.addDevice(await readBody(request, 16384)) }; status = 201; }
        else if (method === "PATCH" && id && !action) data = { device: messaging.editDevice(id, await readBody(request, 16384)) };
        else if (method === "DELETE" && id && !action) { messaging.removeDevice(id); return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } }); }
        else if (method === "POST" && id && action === "test") { data = { id: messaging.testDevice(admin.id, id) }; status = 202; }
        else throw new AuthError(405, "This operation is not supported.");
      } else {
        if (method === "GET" && !action) data = id ? { message: messaging.detail(id) } : messaging.history(Number(new URL(request.url).searchParams.get("page") ?? "1"));
        else if (method === "POST" && !id) { data = { id: messaging.submit(admin.id, await readBody(request, 16384)) }; status = 202; }
        else if (method === "POST" && id && action === "confirm") { data = { confirmation: messaging.confirmObservation(admin.id, id, await readBody(request)) }; status = 201; }
        else if (method === "POST" && id && action === "resend") { data = { id: messaging.resend(admin.id, id) }; status = 202; }
        else throw new AuthError(405, "This operation is not supported.");
      }
      return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
    } catch (error) { return failure(error); }
  }
  return { handle };
}
