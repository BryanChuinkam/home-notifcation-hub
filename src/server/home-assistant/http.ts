import { z } from "zod";
import { AuthError, type Auth } from "../auth/service";
import { failure, readBody, requestToken, sameOrigin } from "../auth/http";
import { HomeAssistantError, type HomeAssistantClient } from "./client";
import { errorNames } from "../../lib/messaging";
import type { HomeAssistantStatus } from "../../lib/home-assistant";
import type { Messaging } from "../notifications/service";
export function homeAssistantHandlers(auth: Auth, messaging: Messaging, client: HomeAssistantClient | null, status: HomeAssistantStatus, origin: string) {
  async function handle(request: Request, action: "status" | "discover" | "register") {
    try {
      if (!auth.session(requestToken(request))) throw new AuthError(401, "Please sign in to continue.");
      if (action === "status") return Response.json(status, { headers: { "Cache-Control": "no-store" } });
      sameOrigin(request, origin);
      if (!client) throw new AuthError(503, status.message);
      if (action === "discover") return Response.json({ targets: await client.discover(), checkedAt: Date.now() }, { headers: { "Cache-Control": "no-store" } });
      const input = z.object({ targetId: z.string().min(1).max(512), name: z.string(), room: z.string(), type: z.enum(["computer", "speaker", "tv", "phone"]) }).strict().safeParse(await readBody(request, 16384));
      if (!input.success) throw new AuthError(422, "Select a discovered target and provide a valid name, room and type.");
      // Re-discover rather than trusting capability/configuration data posted by the browser.
      const target = (await client.discover()).find(item => item.id === input.data.targetId);
      if (!target) throw new AuthError(422, "This target is no longer available in Home Assistant discovery.");
      const { name, room, type } = input.data;
      return Response.json({ device: messaging.registerHomeAssistant(target, { name, room, type }) }, { status: 201, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return failure(error instanceof HomeAssistantError ? new AuthError(error.code === "ha_auth" ? 502 : 503, errorNames[error.code] ?? "Home Assistant could not complete the request.") : error);
    }
  }
  return { handle };
}
