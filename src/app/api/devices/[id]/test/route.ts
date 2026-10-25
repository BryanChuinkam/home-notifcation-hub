import { getRuntime } from "@/server/runtime";
import { failure } from "@/server/auth/http";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await getRuntime().messagingHandlers.handle(request, "devices", (await context.params).id, "test"); }
  catch (error) { return failure(error); }
}
