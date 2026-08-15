import { createFileRoute } from "@tanstack/react-router";
import { CompositionAccessGate } from "./composition";

export const Route = createFileRoute("/desk/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Console Desk (${params.slug}) — Nexium Markets MT5` },
      {
        name: "description",
        content: "Console d'administration et de pilotage du Desk Opérateur Nexium Markets.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDeskPage,
});

function AdminDeskPage() {
  const { slug } = Route.useParams();
  return <CompositionAccessGate customAdminSlug={slug} />;
}
