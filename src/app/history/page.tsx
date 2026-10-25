import Link from "next/link";
import { requireAdmin } from "@/server/auth/page";
import { getRuntime } from "@/server/runtime";
import { AppShell } from "@/components/app-shell";
import { HistoryList } from "@/components/messaging/history-list";
export const dynamic = "force-dynamic";
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { admin } = await requireAdmin(); const requested = Number((await searchParams).page ?? "1");
  const page = Number.isSafeInteger(requested) && requested > 0 && requested <= 100000 ? requested : 1;
  const history = getRuntime().messaging.history(page);
  return <AppShell username={admin.username} active="history"><h1 className="text-3xl font-semibold tracking-tight">Message history</h1><p className="mt-3 text-muted-foreground">Every message and its per-device delivery attempts. Simulated results and real dispatch evidence are labeled separately.</p><div className="mt-7"><HistoryList messages={history.messages} /></div><nav aria-label="History pagination" className="mt-6 flex items-center gap-5">{page > 1 && <Link href={`/history?page=${page - 1}`} className="text-sm text-primary underline">Newer messages</Link>}<span className="text-sm text-muted-foreground">Page {page}</span>{history.hasMore && <Link href={`/history?page=${page + 1}`} className="text-sm text-primary underline">Older messages</Link>}</nav></AppShell>;
}
