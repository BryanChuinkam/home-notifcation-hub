import { getRuntime } from "@/server/runtime";
import { failure } from "@/server/auth/http";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await getRuntime().messagingHandlers.handle(request, "devices", (await context.params).id, undefined); }
  catch (error) { return failure(error); }
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await getRuntime().messagingHandlers.handle(request, "devices", (await context.params).id, undefined); }
  catch (error) { return failure(error); }
}
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await getRuntime().messagingHandlers.handle(request, "devices", (await context.params).id, undefined); }
  catch (error) { return failure(error); }
}
