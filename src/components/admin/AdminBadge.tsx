import type { ReactNode } from "react";

const STYLES = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.12)]",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.12)]",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.12)]",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.12)]",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  slate: "border-slate-700/60 bg-slate-800/60 text-slate-300",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.12)]",
} as const;

const DOT_STYLES = {
  emerald: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]",
  cyan: "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]",
  indigo: "bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.8)]",
  amber: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]",
  sky: "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]",
  purple: "bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]",
  slate: "bg-slate-400",
  rose: "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]",
} as const;

export type AdminBadgeVariant = keyof typeof STYLES;

export function AdminBadge({
  children,
  variant = "emerald",
  dot = true,
}: {
  children: ReactNode;
  variant?: AdminBadgeVariant;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-[13px] font-bold tracking-wide uppercase transition-all ${STYLES[variant] ?? STYLES.emerald}`}
    >
      {dot && <span className={`size-2 rounded-full ${DOT_STYLES[variant] ?? DOT_STYLES.emerald} animate-pulse`} />}
      {children}
    </span>
  );
}

