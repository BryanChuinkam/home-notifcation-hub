import Link from "next/link";
import { House, LayoutDashboard, Monitor, Speaker, Tv, ArrowRight, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/server/auth/page";
import { LogoutButton } from "@/components/logout-button";
export const dynamic = "force-dynamic";
const icons = { speaker: Speaker, tv: Tv, computer: Monitor };
const capabilityNames = { text: "Text", speech: "Speech", overlay: "Overlay", acknowledgment: "Acknowledgment" };
export default async function Dashboard() {
  const { admin, devices } = await requireAdmin();
  return <div className="mx-auto min-h-dvh max-w-[1440px] md:grid md:grid-cols-[224px_1fr]">
    <a href="#main" className="skip-link">Skip to content</a>
    <aside className="border-b border-border bg-[#eff3ee] px-6 py-6 md:flex md:min-h-dvh md:flex-col md:border-r md:border-b-0 md:py-9">
      <div className="flex items-center gap-3 font-semibold"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"><House size={21} aria-hidden="true" /></span><span>Home<br /><span className="text-xs font-normal text-muted-foreground">Notification Hub</span></span></div>
      <nav aria-label="Main navigation" className="mt-7 flex flex-wrap gap-2 md:flex-col"><Link href="/" aria-current="page" className="flex min-h-11 items-center gap-3 rounded-lg bg-white px-3 text-sm font-semibold"><LayoutDashboard size={18} aria-hidden="true" />Overview</Link><a href="#devices" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-white/60"><Monitor size={18} aria-hidden="true" />Devices</a></nav>
      <div className="mt-auto hidden pt-12 md:block"><ShieldCheck size={20} className="mb-2 text-primary" aria-hidden="true" /><p className="text-sm font-medium">Your household, privately.</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Only signed-in administrators can access this hub.</p></div>
    </aside>
    <div className="min-w-0 px-5 sm:px-9 lg:px-14">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-5"><p className="text-sm text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{admin.username}</span></p><LogoutButton /></header>
      <main id="main" className="py-9 md:py-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your household</h1><p className="mt-3 max-w-xl text-muted-foreground">A shared message can bring everyone a little closer. Your hub is ready to explore.</p>
        <section aria-labelledby="sample-heading" className="mt-9 rounded-xl bg-[#e8f0e5] p-5 sm:p-6"><div className="flex items-start gap-4"><House className="mt-1 shrink-0 text-primary" size={23} aria-hidden="true" /><div><h2 id="sample-heading" className="font-semibold">Start with a sample household</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">These are mock devices, saved in your hub so you can explore its layout. No physical devices are connected, and no notifications will be sent.</p></div></div></section>
        <section id="devices" aria-labelledby="devices-heading" className="mt-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="devices-heading" className="text-xl font-semibold">Household devices</h2><p className="mt-1 text-sm text-muted-foreground">{devices.length} sample devices · communication status unknown</p></div><span className="text-xs font-medium text-muted-foreground">All devices use the mock integration</span></div>
          <ul className="mt-5 divide-y divide-border border-y border-border">{devices.map(device => { const Icon = icons[device.type]; return <li key={device.id} className="flex flex-wrap items-center gap-4 py-5 sm:gap-5"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted"><Icon size={23} aria-hidden="true" /></span><div className="min-w-0 flex-1"><h3 className="font-semibold">{device.name}</h3><p className="mt-1 text-sm text-muted-foreground">{device.room} · Mock device</p><div className="mt-2 flex flex-wrap gap-2">{device.capabilities.map(capability => <span key={capability} className="rounded-md bg-muted px-2 py-1 text-xs">{capabilityNames[capability]}</span>)}</div></div><p className="ml-16 text-xs text-muted-foreground sm:ml-0">Not tested</p></li>; })}</ul>
        </section>
        <section id="next-step" aria-labelledby="next-heading" className="mt-10 flex items-start gap-4"><ArrowRight className="mt-1 shrink-0 text-primary" size={21} aria-hidden="true" /><div><h2 id="next-heading" className="font-semibold">Next up: household messaging</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">Message composition, device management, and delivery history will arrive in the next milestone. For now, your administrator account and sample devices are safely stored.</p></div></section>
      </main>
      <footer className="border-t border-border py-5 text-xs text-muted-foreground">Home Notification Hub · No real notifications enabled</footer>
    </div>
  </div>;
}
