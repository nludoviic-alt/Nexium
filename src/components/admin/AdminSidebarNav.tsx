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
    <nav className="space-y-1.5" aria-label="Navigation principale">
      <div className="flex items-center justify-between px-3 py-1.5 mb-1">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          Modules &amp; Gouvernance
        </span>
        <span className="text-[10px] font-mono text-slate-500 font-semibold">
          {items.length} sections
        </span>
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              aria-current={item.isActive ? "page" : undefined}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 sm:px-3.5 sm:py-2.5 text-sm sm:text-[15px] font-semibold transition-all cursor-pointer active:scale-[0.99] min-h-[44px] ${
                item.isActive
                  ? "border border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-transparent text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.18)]"
                  : "border border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700/50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`size-8 rounded-lg grid place-items-center shrink-0 transition-colors ${
                    item.isActive
                      ? "bg-emerald-500/25 text-emerald-300 shadow-sm shadow-emerald-500/20"
                      : "bg-[#101826] text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/80 border border-slate-800"
                  }`}
                >
                  <Icon className="size-4.5" />
                </div>
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`shrink-0 text-[11px] sm:text-xs font-mono px-2 py-0.5 rounded-full font-bold ml-2 shadow-xs ${
                    item.badgeTone === "alert"
                      ? "bg-amber-400 text-slate-950 border border-amber-300 shadow-amber-400/30 animate-pulse"
                      : item.badgeTone === "brand"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-slate-800 text-slate-300 border border-slate-700/70"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

