"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
export function LogoutButton() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) { setError("Couldn't sign out. Please try again."); return; }
      router.replace("/login"); router.refresh();
    } catch { setError("Couldn't reach the hub. Please try again."); }
    finally { setBusy(false); }
  }
  return <div><Button variant="ghost" onClick={logout} disabled={busy}><LogOut aria-hidden="true" />{busy ? "Signing out…" : "Sign out"}</Button><p role="alert" className="text-sm text-red-800">{error}</p></div>;
}
