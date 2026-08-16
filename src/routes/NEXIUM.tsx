import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const NexiumDashboardLazy = lazy(() =>
  import("./-nexium-dashboard").then((m) => ({ default: m.NexiumDashboard }))
);

function DashboardLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0d12]">
      <div className="size-10 animate-spin rounded-full border-2 border-white/10 border-t-[#00D084]" />
    </div>
  );
}

export const Route = createFileRoute("/NEXIUM")({
  head: () => ({
    meta: [
      { title: "Tableau de Bord Institutionnel — Nexium Markets MT5" },
      {
        name: "description",
        content:
          "AI Trading Control Center Nexium Markets : supervision en temps réel des 3 moteurs automatisés (AI Gold, FX Trend, Index Reversion), graphiques de trading en direct, télémétrie FIX et gouvernance du risque.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <NexiumDashboardLazy />
    </Suspense>
  ),
});
