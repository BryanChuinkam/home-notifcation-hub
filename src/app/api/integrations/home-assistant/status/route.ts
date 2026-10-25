import { getRuntime } from "@/server/runtime";
import { failure } from "@/server/auth/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { return await getRuntime().homeAssistantHandlers.handle(request, "status"); } catch (error) { return failure(error); }
}
