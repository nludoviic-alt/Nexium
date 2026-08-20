import type { ComponentType } from "react";

export interface AdminNavItem {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string | number | undefined;
  /** "alert" = demande en attente d'action (ambre, pulse) — disparaît dès que le badge sous-jacent retombe à 0. */
  badgeTone?: "default" | "brand" | "alert";
  isActive: boolean;
}

export function AdminSidebarNav({ items, onSelect }: { items: AdminNavItem[]; onSelect: (key: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs sm:text-[13px] font-bold tracking-wider text-slate-400 uppercase px-3.5 py-2 font-mono">
        Gouvernance &amp; Modules
      </p>

      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            aria-current={item.isActive ? "page" : undefined}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-base sm:text-[16px] font-semibold transition-all cursor-pointer ${
              item.isActive
                ? "border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-transparent text-white font-bold shadow-[0_0_16px_rgba(16,185,129,0.15)]"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Icon className={`size-5.5 ${item.isActive ? "text-emerald-400" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span
                className={`text-xs sm:text-[13px] font-mono px-2.5 py-0.5 rounded-lg font-bold ${
                  item.badgeTone === "alert"
                    ? "bg-amber-500 text-black border border-amber-400 animate-pulse"
                    : item.badgeTone === "brand"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-800/90 text-slate-300 border border-slate-700/60"
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

