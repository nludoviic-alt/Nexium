import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONE_TEXT: Record<string, string> = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  warning: "text-amber-400",
  neutral: "text-white",
  indigo: "text-indigo-400",
  cyan: "text-cyan-400",
};

const TONE_BG: Record<string, string> = {
  positive: "border-emerald-500/20 bg-emerald-500/5",
  negative: "border-rose-500/20 bg-rose-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  neutral: "border-slate-700/50 bg-[#121a2d]/80",
  indigo: "border-indigo-500/20 bg-indigo-500/5",
  cyan: "border-cyan-500/20 bg-cyan-500/5",
};

export function AdminStatTile({
  label,
  value,
  tone = "neutral",
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: "positive" | "negative" | "warning" | "neutral" | "indigo" | "cyan";
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 sm:p-6 shadow-lg backdrop-blur-sm transition-all hover:border-slate-600/70",
        TONE_BG[tone] ?? TONE_BG.neutral,
        className
      )}
    >
      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 block truncate">
        {label}
      </span>
      <strong className={cn("text-2xl sm:text-3xl font-bold font-mono tracking-tight mt-2 block", TONE_TEXT[tone] ?? TONE_TEXT.neutral)}>
        {value}
      </strong>
      {sub && <span className="text-xs sm:text-sm text-slate-400 mt-2 flex items-center gap-1.5 block">{sub}</span>}
    </div>
  );
}

