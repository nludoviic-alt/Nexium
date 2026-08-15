import { createFileRoute } from "@tanstack/react-router";
import { NexiumDashboard } from "./NEXIUM";

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
  return <NexiumDashboard customSlug={slug} />;
}
