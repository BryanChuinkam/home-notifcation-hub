import Link from "next/link";
import { House, LayoutDashboard, Monitor, History, ShieldCheck, Settings } from "lucide-react";
import { LogoutButton } from "./logout-button";
export function AppShell({ username, active, children }: { username: string; active: "overview" | "devices" | "history" | "settings"; children: React.ReactNode }) {
  const links = [{ id: "overview", href: "/", title: "Overview", icon: LayoutDashboard }, { id: "devices", href: "/devices", title: "Devices", icon: Monitor }, { id: "history", href: "/history", title: "History", icon: History }, { id: "settings", href: "/settings", title: "Settings", icon: Settings }];
  return <div className="mx-auto min-h-dvh max-w-[1440px] md:grid md:grid-cols-[224px_1fr]">
    <a href="#main" className="skip-link">Skip to content</a>
    <aside className="border-b border-border bg-[#eff3ee] px-6 py-6 md:flex md:min-h-dvh md:flex-col md:border-r md:border-b-0 md:py-9">
      <div className="flex items-center gap-3 font-semibold"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"><House size={21} aria-hidden="true" /></span><span>Home<br /><span className="text-xs font-normal text-muted-foreground">Notification Hub</span></span></div>
      <nav aria-label="Main navigation" className="mt-7 flex flex-wrap gap-2 md:flex-col">{links.map(({ id, href, title, icon: Icon }) => <Link key={id} href={href} aria-current={active === id ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-white/60 ${active === id ? "bg-white font-semibold" : ""}`}><Icon size={18} aria-hidden="true" />{title}</Link>)}</nav>
      <div className="mt-auto hidden pt-12 md:block"><ShieldCheck size={20} className="mb-2 text-primary" aria-hidden="true" /><p className="text-sm font-medium">Your household, privately.</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Only signed-in administrators can access this hub.</p></div>
    </aside>
    <div className="min-w-0 px-5 sm:px-9 lg:px-12"><header className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-5"><p className="text-sm text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{username}</span></p><LogoutButton /></header><main id="main" className="py-9 md:py-12">{children}</main><footer className="border-t border-border py-5 text-xs text-muted-foreground">Home Notification Hub · Delivery evidence is reported per device</footer></div>
  </div>;
}
