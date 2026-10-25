"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../ui/button";
import { api, errorText } from "./api";
import { dateLabel, errorNames, deliveryStateName } from "@/lib/messaging";
import type { MessageDetail as Detail } from "@/server/notifications/types";
export function MessageDetail({ initial }: { initial: Detail }) {
  const router = useRouter(); const [message, setMessage] = useState(initial); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false); const [observing, setObserving] = useState<string | null>(null);
  const pending = message.deliveries.some(target => target.state === "queued" || target.state === "processing");
  useEffect(() => {
    if (!pending) return;
    let alive = true;
    async function refresh() { try { const data = await api<{ message: Detail }>(`/api/messages/${initial.id}`); if (alive) { setMessage(data.message); setError(""); } } catch (error) { if (alive) setError(errorText(error)); } }
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 1000);
    window.addEventListener("focus", refresh);
    return () => { alive = false; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [initial.id, pending]);
  async function resend() { setBusy(true); setError(""); try { const result = await api<{ id: string }>(`/api/messages/${message.id}/resend`, { method: "POST" }); router.push(`/history/${result.id}`); } catch (error) { setError(errorText(error)); } finally { setBusy(false); } }
  async function observe(deliveryId: string) {
    setBusy(true); setError("");
    try {
      await api(`/api/messages/${message.id}/confirm`, { method: "POST", body: JSON.stringify({ deliveryId, observation: message.mode === "speech" ? "spoken" : "displayed" }) });
      const data = await api<{ message: Detail }>(`/api/messages/${message.id}`); setMessage(data.message); setObserving(null);
    } catch (error) { setError(errorText(error)); } finally { setBusy(false); }
  }
  return <div><Link href="/history" className="text-sm text-primary underline underline-offset-4">Back to history</Link><h1 className="mt-6 break-words text-3xl font-semibold tracking-tight">{message.title || "Message details"}</h1><p className="mt-2 text-sm text-muted-foreground">{dateLabel(message.createdAt)} · Sent by {message.senderName}</p>
    <p className="mt-6 rounded-lg bg-muted p-4 text-sm">{message.deliveries.every(target => target.simulated) ? "All results below are simulated. Acceptance is a mock receiver response; it does not prove physical display, speech or acknowledgment." : "Home Assistant API success proves dispatch only. Physical display or speech requires separate observation; it is not automatic acknowledgment."}</p>
    <div className="mt-6 rounded-xl border border-border bg-white p-5"><p className="whitespace-pre-wrap break-words">{message.body}</p><p className="mt-4 text-sm capitalize text-muted-foreground">{message.mode} · {message.priority} priority · {message.kind === "test" ? "Device test" : "Household message"}</p></div>
    <section aria-labelledby="results-heading" className="mt-9"><h2 id="results-heading" className="text-xl font-semibold">Delivery results</h2><p role="status" className="mt-2 text-sm text-muted-foreground">{pending ? "Delivery is in progress. Results update automatically." : "All delivery attempts are complete."}</p><ul className="mt-4 divide-y divide-border border-y border-border">{message.deliveries.map(target => <li key={target.id} className="py-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="min-w-0 flex-1 break-words font-semibold">{target.deviceName}</h3><span className={`rounded-md px-2 py-1 text-xs font-medium ${target.state === "failed" ? "bg-red-50 text-red-800" : "bg-muted"}`}>{target.state === "queued" && target.attemptCount ? "Retry scheduled" : deliveryStateName(target.state, target.simulated)}</span></div><p className="mt-2 text-sm text-muted-foreground">{target.simulated ? "Mock adapter" : "Home Assistant"} · {target.attemptCount} {target.attemptCount === 1 ? "attempt" : "attempts"} · {Math.max(0, target.attemptCount - 1)} {target.attemptCount === 2 ? "retry" : "retries"}{target.deviceId ? "" : " · Device removed"}</p>{target.errorCode && <p className="mt-2 text-sm text-red-800">{errorNames[target.errorCode] ?? "This delivery could not be completed."}</p>}{target.state === "queued" && target.attemptCount > 0 && <p className="mt-1 text-xs text-muted-foreground">Next attempt: {dateLabel(target.nextAttemptAt)}</p>}
      {target.attempts.length > 0 && <details className="mt-3 text-sm"><summary className="min-h-8 cursor-pointer text-primary">View attempts ({target.attempts.length})</summary><ol className="mt-2 space-y-2 text-xs text-muted-foreground">{target.attempts.map(attempt => <li key={attempt.id}>Attempt {attempt.number}: {deliveryStateName(attempt.state, target.simulated)} · {dateLabel(attempt.startedAt)}{attempt.errorCode ? ` · ${errorNames[attempt.errorCode] ?? "Adapter failure"}` : ""}</li>)}</ol></details>}
      {target.confirmation && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">Manually observed {target.confirmation.observation} by {target.confirmation.observer} at {dateLabel(target.confirmation.confirmedAt)}. This is operator evidence, not automatic acknowledgment.</p>}
      {!target.confirmation && message.kind === "test" && !target.simulated && target.deviceId && (["dispatched", "accepted"].includes(target.state) || (target.state === "failed" && target.errorCode === "ha_outcome_unknown")) && <div className="mt-4">{observing === target.id ? <div className="rounded-lg bg-muted p-4"><p className="mb-3 text-sm">Only record this if you personally observed this exact test on the selected receiver. The transport outcome will be kept separately.</p><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => observe(target.id)}>{message.mode === "speech" ? "I heard this test on the speaker" : "I saw this test on the device"}</Button><Button disabled={busy} variant="ghost" onClick={() => setObserving(null)}>Cancel observation</Button></div></div> : <Button variant="outline" disabled={busy} onClick={() => setObserving(target.id)}>Record physical observation</Button>}</div>}
    </li>)}</ul></section>
    <div className="mt-7">{confirm ? <div><p className="mb-3 text-sm">Send this message again to the original recipients? This creates a new history entry. Removed, disabled or incompatible recipients must be changed in a new message.</p><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={resend}>{busy ? "Queueing…" : "Confirm resend"}</Button><Button variant="ghost" disabled={busy} onClick={() => setConfirm(false)}>Cancel</Button></div></div> : <Button variant="outline" disabled={pending} onClick={() => setConfirm(true)}>Resend message</Button>}</div>
    <p role="alert" className="mt-4 text-sm font-medium text-red-800">{error}</p>
  </div>;
}
