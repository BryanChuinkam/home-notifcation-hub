import Link from "next/link";
import { requireAdmin } from "@/server/auth/page";
import { getRuntime } from "@/server/runtime";
import { AppShell } from "@/components/app-shell";
import { Composer } from "@/components/messaging/composer";
import { HistoryList } from "@/components/messaging/history-list";
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const { admin } = await requireAdmin(); const { messaging } = getRuntime();
  return <AppShell username={admin.username} active="overview"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your household</h1><p className="mt-3 max-w-xl text-muted-foreground">Bring everyone a little closer, one message at a time.</p><p className="mt-5 text-sm text-muted-foreground">Mock sends are simulated. Home Assistant dispatch does not prove display or speech; verify real tests separately.</p>
    <div className="mt-7 grid items-start gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"><Composer devices={messaging.listDevices()} availableAdapters={messaging.availableAdapters()} /><section aria-labelledby="recent-heading"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="recent-heading" className="text-xl font-semibold">Recent messages</h2><Link href="/history" className="text-sm text-primary underline underline-offset-4">View all history</Link></div><HistoryList messages={messaging.history().messages.slice(0, 5)} compact /><Link href="/devices" className="mt-5 inline-block text-sm text-primary underline underline-offset-4">Manage mock devices</Link></section></div>
  </AppShell>;
}
