import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { getRuntime } from "@/server/runtime";
export const dynamic = "force-dynamic";
export default function SetupPage() {
  const { auth } = getRuntime();
  if (auth.isSetup()) redirect("/login");
  return <AuthShell title="Make yourself at home." description="Create the administrator account for your household. You only need to do this once.">
    {!auth.setupReady && <p role="status" className="mt-6 rounded-lg bg-muted p-4 text-sm">Setup is not enabled yet. On the server, generate a secret with <code>npm run setup:secret</code>, set <code>HUB_SETUP_SECRET</code> in <code>.env.local</code>, and restart the hub.</p>}
    <AuthForm mode="setup" available={auth.setupReady} />
  </AuthShell>;
}
