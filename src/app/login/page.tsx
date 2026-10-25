import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { getRuntime } from "@/server/runtime";
import { SESSION_COOKIE } from "@/server/auth/http";
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { auth } = getRuntime();
  if (!auth.isSetup()) redirect("/setup");
  if (auth.session((await cookies()).get(SESSION_COOKIE)?.value)) redirect("/");
  return <AuthShell title="Welcome home." description="Sign in to your household’s notification hub.">
    {(await searchParams).created === "1" && <p role="status" className="mt-6 rounded-lg bg-muted p-4 text-sm">Your administrator account is ready. Sign in to continue.</p>}
    <AuthForm mode="login" />
  </AuthShell>;
}
