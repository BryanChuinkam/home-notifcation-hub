"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode, available = true }: { mode: "setup" | "login"; available?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(""); setBusy(true);
    try {
      const values = Object.fromEntries(new FormData(form));
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!response.ok) {
        const result = await response.json();
        setError(result.error ?? "Unable to continue. Please try again.");
        return;
      }
      form.reset();
      router.replace(mode === "setup" ? "/login?created=1" : "/");
      router.refresh();
    } catch { setError("We couldn't reach the hub. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={busy}>
    {mode === "setup" && <div><label htmlFor="secret">Server setup secret</label><Input id="secret" name="secret" type="password" minLength={32} maxLength={256} autoComplete="off" required disabled={!available || busy} aria-describedby="secret-help" /><p id="secret-help" className="mt-2 text-sm text-muted-foreground">Use the one-time secret configured by the person running this hub.</p></div>}
    <div><label htmlFor="username">Username</label><Input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} pattern="[a-zA-Z0-9_.\-]{3,32}" minLength={3} maxLength={32} required disabled={!available || busy} aria-describedby={mode === "setup" ? "username-help" : undefined} />{mode === "setup" && <p id="username-help" className="mt-2 text-sm text-muted-foreground">3–32 letters, numbers, dots, underscores or hyphens.</p>}</div>
    <div><label htmlFor="password">Password</label><Input id="password" name="password" type="password" autoComplete={mode === "setup" ? "new-password" : "current-password"} minLength={mode === "setup" ? 12 : 1} maxLength={128} required disabled={!available || busy} aria-describedby={mode === "setup" ? "password-help" : undefined} />{mode === "setup" && <p id="password-help" className="mt-2 text-sm text-muted-foreground">Use a unique password with 12–128 characters.</p>}</div>
    <div role="alert" className="text-sm font-medium text-red-800">{error}</div>
    <Button className="w-full" disabled={busy || !available} type="submit">{busy ? "Please wait…" : mode === "setup" ? "Create administrator" : "Sign in"}<ArrowRight aria-hidden="true" /></Button>
  </form>;
}
