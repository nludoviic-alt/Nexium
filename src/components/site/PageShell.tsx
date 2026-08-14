import type { ReactNode } from "react";

import { ChatWidget } from "@/components/site/ChatWidget";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export function PageShell({
  children,
  transparentHeader = false,
}: {
  children: ReactNode;
  transparentHeader?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#05080e] text-white">
      <SiteHeader transparent={transparentHeader} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative w-full bg-[#05080e] py-16 sm:py-24 border-b border-gray-800 text-white overflow-hidden">
      {/* Background Decorative Lines */}
      <div className="absolute top-0 bottom-0 left-[12%] w-px bg-gradient-to-b from-transparent via-[#00ff66]/20 to-transparent pointer-events-none hidden md:block" />
      <div className="absolute top-0 bottom-0 right-[12%] w-px bg-gradient-to-b from-transparent via-[#00ff66]/20 to-transparent pointer-events-none hidden md:block" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8">
        {eyebrow ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00ff66]/40 bg-[#00ff66]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#00ff66] backdrop-blur-md shadow-[0_0_20px_rgba(0,255,102,0.2)]">
            <span className="size-2 rounded-full bg-[#00ff66] animate-pulse" />
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-300 font-medium">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8 py-16 sm:py-20 ${className}`}
    >
      {children}
    </section>
  );
}

export function DemoBadge({ label = "DEMO" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-warning">
      {label}
    </span>
  );
}

export function NotConfigured({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-5">
      <span className="inline-flex items-center rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
        NOT_CONFIGURED
      </span>
      <p className="mt-3 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
