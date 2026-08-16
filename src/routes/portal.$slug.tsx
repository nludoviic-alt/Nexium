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

export const Route = createFileRoute("/portal/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Portail Trader (${params.slug}) — Nexium Markets MT5` },
      {
        name: "description",
        content: "Espace client personnalisé et console de pilotage des Expert Advisors MetaTrader 5.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UserPortalPage,
});

function UserPortalPage() {
  const { slug } = Route.useParams();
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <NexiumDashboardLazy customSlug={slug} />
    </Suspense>
  );
}
