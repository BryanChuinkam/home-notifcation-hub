import { getRuntime } from "@/server/runtime";
import { failure } from "@/server/auth/http";
export const runtime = "nodejs";
export function GET(request: Request) {
  try { return getRuntime().handlers.getDevices(request); }
  catch (error) { return failure(error); }
}
