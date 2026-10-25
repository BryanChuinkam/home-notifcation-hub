import { requireAdmin } from "@/server/auth/page";
import { getRuntime } from "@/server/runtime";
import { AppShell } from "@/components/app-shell";
import { DeviceManager } from "@/components/messaging/device-manager";
export const dynamic = "force-dynamic";
export default async function DevicesPage() {
  const { admin } = await requireAdmin();
  return <AppShell username={admin.username} active="devices"><h1 className="text-3xl font-semibold tracking-tight">Household devices</h1><p className="mt-3 max-w-2xl text-muted-foreground">Register mock devices, choose their capabilities and test simulated delivery. Real integrations are not connected.</p><DeviceManager initial={getRuntime().messaging.listDevices()} /></AppShell>;
}
