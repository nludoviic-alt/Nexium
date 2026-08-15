import { createFileRoute } from "@tanstack/react-router";
import { CompositionAccessGate } from "./composition";

export const Route = createFileRoute("/admin/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Administration (${params.slug}) — Nexium Markets MT5` },
      {
        name: "description",
        content: "Console d'administration Nexium Markets.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { slug } = Route.useParams();
  return <CompositionAccessGate customAdminSlug={slug} />;
}
