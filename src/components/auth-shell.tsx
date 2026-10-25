import { House } from "lucide-react";
export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
    <div className="mb-10 flex items-center gap-3 text-sm font-semibold"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"><House size={21} aria-hidden="true" /></span>Home Notification Hub</div>
    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-3 text-base text-muted-foreground">{description}</p>{children}
    <p className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">One private place for your household&apos;s messages.</p>
  </main>;
}
