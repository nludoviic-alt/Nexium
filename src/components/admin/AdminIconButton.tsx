import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminIconButton({
  icon,
  ariaLabel,
  onClick,
  className,
  tone = "default",
  title,
}: {
  icon: ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  className?: string;
  tone?: "default" | "danger" | "brand";
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={cn(
        "grid size-9 place-items-center rounded-xl border transition-all cursor-pointer",
        tone === "danger"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 shadow-sm"
          : tone === "brand"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-sm"
          : "border-slate-700/60 bg-[#0c121e] text-slate-300 hover:bg-slate-800 hover:text-white shadow-sm",
        className
      )}
    >
      {icon}
    </button>
  );
}

