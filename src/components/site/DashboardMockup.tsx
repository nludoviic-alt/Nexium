import { Activity, ArrowUpRight, Bot } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

import { DemoBadge } from "@/components/site/PageShell";

/** Equity curve of the DEMO dataset — illustration produit, pas une performance réelle. */
const demoCurve = [
  { v: 10000 },
  { v: 10180 },
  { v: 10120 },
  { v: 10420 },
  { v: 10380 },
  { v: 10710 },
  { v: 10950 },
  { v: 10880 },
  { v: 11240 },
  { v: 11460 },
];

export function DashboardMockup() {
  return (
    <div className="glass-panel relative rounded-2xl p-4 shadow-[var(--shadow-elevated)] sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Activity className="size-4 text-accent" />
          Vue générale
        </div>
        <DemoBadge />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { label: "Balance", value: "11 460.00", unit: "USD" },
          { label: "Equity", value: "11 512.40", unit: "USD" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="tabular mt-1 text-lg font-semibold">{k.value}</p>
            <p className="text-[11px] text-muted-foreground">{k.unit}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-border bg-background/50 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Courbe d'equity (30 j)</p>
          <span className="tabular flex items-center gap-1 text-xs text-success">
            <ArrowUpRight className="size-3" />
            +14.6%
          </span>
        </div>
        <div className="mt-2 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demoCurve} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--color-accent)"
                strokeWidth={2}
                fill="url(#equityFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {[
          { name: "Nexium AI Gold", account: "MT5 · 5102934", online: true },
          { name: "Nexium FX Trend", account: "MT5 · 5107741", online: false },
        ].map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Bot className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{r.name}</p>
                <p className="tabular text-[11px] text-muted-foreground">{r.account}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${
                r.online
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border bg-secondary text-muted-foreground"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${r.online ? "bg-success" : "bg-muted-foreground"}`}
              />
              {r.online ? "Connecté" : "Hors ligne"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
