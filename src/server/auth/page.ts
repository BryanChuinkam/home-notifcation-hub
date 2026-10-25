import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./http";
import { getRuntime } from "../runtime";
export async function requireAdmin() {
  const runtime = getRuntime();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const admin = runtime.auth.session(token);
  if (!admin) redirect(runtime.auth.isSetup() ? "/login" : "/setup");
  return { admin, devices: runtime.auth.listDevices(token) };
}
