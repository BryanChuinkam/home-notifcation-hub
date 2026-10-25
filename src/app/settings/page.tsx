import { requireAdmin } from "@/server/auth/page";
import { getRuntime } from "@/server/runtime";
import { AppShell } from "@/components/app-shell";
import { HomeAssistantSettings } from "@/components/home-assistant-settings";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const { admin } = await requireAdmin();
  return <AppShell username={admin.username} active="settings"><h1 className="text-3xl font-semibold tracking-tight">Integration settings</h1><p className="mt-3 text-muted-foreground">Connect a server-configured Home Assistant instance and choose notification targets.</p><HomeAssistantSettings initial={getRuntime().integrationStatus} /></AppShell>;
}
