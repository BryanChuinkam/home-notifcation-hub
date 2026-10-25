import { getRuntime } from "@/server/runtime";
import { failure } from "@/server/auth/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { return await getRuntime().messagingHandlers.handle(request, "devices", undefined, undefined); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try { return await getRuntime().messagingHandlers.handle(request, "devices", undefined, undefined); }
  catch (error) { return failure(error); }
}
