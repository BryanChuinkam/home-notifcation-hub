import { getRuntime } from "@/server/runtime";
import { failure } from "@/server/auth/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { return await getRuntime().homeAssistantHandlers.handle(request, "discover"); } catch (error) { return failure(error); }
}
