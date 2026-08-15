import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONE_BORDER: Record<string, string> = {
  default: "border-slate-700/50 bg-[#121a2d]/90 shadow-black/30",
  brand: "border-emerald-500/30 bg-gradient-to-b from-[#122624]/90 to-[#0e1b1e]/90 shadow-emerald-950/20",
  indigo: "border-indigo-500/30 bg-gradient-to-b from-[#161c36]/90 to-[#101528]/90 shadow-indigo-950/20",
  warning: "border-amber-500/30 bg-gradient-to-b from-[#241a12]/90 to-[#1a130e]/90 shadow-amber-950/20",
  danger: "border-rose-500/30 bg-gradient-to-b from-[#261318]/90 to-[#1c0f13]/90 shadow-rose-950/20",
};

export function AdminPanel({
  children,
  className,
  tone = "default",
  padding = "p-6",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "brand" | "indigo" | "warning" | "danger";
  padding?: "p-4" | "p-5" | "p-6" | "p-8";
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border shadow-xl backdrop-blur-sm transition-all",
        TONE_BORDER[tone] ?? TONE_BORDER.default,
        padding,
        className
      )}
    >
      {children}
    </div>
  );
}

