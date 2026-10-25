import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth/page";
import { getRuntime } from "@/server/runtime";
import { AuthError } from "@/server/auth/service";
import { AppShell } from "@/components/app-shell";
import { MessageDetail } from "@/components/messaging/message-detail";
export const dynamic = "force-dynamic";
export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { admin } = await requireAdmin(); let message;
  try { message = getRuntime().messaging.detail((await params).id); }
  catch (error) { if (error instanceof AuthError && error.status === 404) notFound(); throw error; }
  return <AppShell username={admin.username} active="history"><MessageDetail key={message.id} initial={message} /></AppShell>;
}
