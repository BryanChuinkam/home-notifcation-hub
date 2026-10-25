"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { api, errorText } from "./api";
import { modes, type DeliveryMode } from "@/lib/messaging";
import type { RegisteredDevice } from "@/server/notifications/types";
export function Composer({ devices, availableAdapters = ["mock"] }: { devices: RegisteredDevice[]; availableAdapters?: string[] }) {
  const router = useRouter(); const [body, setBody] = useState(""); const [title, setTitle] = useState("");
  const [mode, setMode] = useState<DeliveryMode>("text"); const [priority, setPriority] = useState("normal");
  const [recipients, setRecipients] = useState<string[]>([]); const [review, setReview] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const selected = devices.filter(device => recipients.includes(device.id));
  const incompatible = selected.some(device => !device.enabled || !availableAdapters.includes(device.adapter) || !device.capabilities.includes(mode));
  const ready = !!body.trim() && selected.length > 0 && selected.length <= 50 && !incompatible;
  function preview(event: FormEvent) { event.preventDefault(); if (ready) { setError(""); setReview(true); } }
  async function send() {
    setBusy(true); setError("");
    try { const result = await api<{ id: string }>("/api/messages", { method: "POST", body: JSON.stringify({ title, body, mode, priority, recipients }) }); router.push(`/history/${result.id}`); }
    catch (error) { setError(errorText(error)); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="compose-heading" className="rounded-xl border border-border bg-white p-5 sm:p-7"><h2 id="compose-heading" className="text-xl font-semibold">Send a household message</h2><p className="mt-2 text-sm text-muted-foreground">Choose recipients and preview your message. Mock targets simulate delivery; Home Assistant targets make real service calls.</p>
    {review ? <div className="mt-6 space-y-5"><h3 className="font-semibold">Review your message</h3><div className="rounded-lg bg-muted p-4"><p className="font-semibold">{title || "Untitled message"}</p><p className="mt-2 whitespace-pre-wrap break-words">{body}</p></div><p className="break-words text-sm">To: {selected.map(device => device.name).join(", ")}</p><p className="text-sm capitalize">{mode} · {priority} priority · {selected.some(device => device.adapter === "home_assistant") ? "Real Home Assistant dispatch is included" : "Simulated delivery"}</p><div className="flex flex-wrap gap-2"><Button type="button" onClick={send} disabled={busy}><Send aria-hidden="true" />{busy ? "Queueing…" : selected.some(device => device.adapter === "home_assistant") ? "Send message" : "Send simulated message"}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setReview(false)}><ArrowLeft aria-hidden="true" />Edit message</Button></div></div> : <form onSubmit={preview} className="mt-6 space-y-5">
      <div><label htmlFor="message-title">Title <span className="font-normal text-muted-foreground">(optional)</span></label><Input id="message-title" maxLength={100} value={title} onChange={event => setTitle(event.target.value)} /></div>
      <div><label htmlFor="message-body">Message</label><textarea id="message-body" className="field min-h-28 resize-y" value={body} onChange={event => setBody(event.target.value)} maxLength={1000} required rows={4} placeholder="Dinner is ready. Please come downstairs." /><p className="mt-1 text-right text-xs text-muted-foreground">{body.length}/1000</p></div>
      <div className="grid grid-cols-2 gap-4"><div><label htmlFor="delivery-mode">Delivery mode</label><select id="delivery-mode" className="field capitalize" value={mode} onChange={event => setMode(event.target.value as DeliveryMode)}>{modes.map(value => <option key={value} value={value}>{value}</option>)}</select></div><div><label htmlFor="priority">Priority</label><select id="priority" className="field" value={priority} onChange={event => setPriority(event.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></div></div>
      <fieldset><legend className="mb-2 text-sm font-semibold">Recipients <span className="font-normal text-muted-foreground">({selected.length} selected)</span></legend>
        {devices.length === 0 && <p className="text-sm text-muted-foreground">Add a mock device from Devices to send your first message.</p>}
        <div className="divide-y divide-border">{devices.map(device => {
          const supported = device.enabled && availableAdapters.includes(device.adapter) && device.capabilities.includes(mode); const checked = recipients.includes(device.id);
          return <label key={device.id} className={`mb-0 flex min-h-14 cursor-pointer items-start gap-3 py-3 font-normal ${!supported ? "text-muted-foreground" : ""}`}><input type="checkbox" className="mt-1 size-5 shrink-0 accent-primary" checked={checked} disabled={!supported && !checked} onChange={() => setRecipients(checked ? recipients.filter(id => id !== device.id) : [...recipients, device.id])} /><span className="min-w-0"><span className="block break-words font-medium">{device.name}</span><span className="text-xs">{device.room} · {device.adapter === "mock" ? "Mock" : "Home Assistant"} · {!availableAdapters.includes(device.adapter) ? "Integration not configured" : device.enabled ? device.capabilities.join(", ") : "Disabled"}{device.enabled && !supported ? ` · Doesn't support ${mode}` : ""}</span></span></label>;
        })}</div>
      </fieldset>
      {incompatible && <p role="status" className="text-sm text-red-800">A selected device cannot support this delivery. Remove it or choose another mode.</p>}
      <Button type="submit" disabled={!ready}>Review message</Button>
    </form>}
    <p role="alert" className="mt-4 text-sm font-medium text-red-800">{error}</p>
  </section>;
}
