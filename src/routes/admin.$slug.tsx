import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const LazyCompositionAccessGate = lazy(() =>
  import("./composition").then((m) => ({ default: m.CompositionAccessGate }))
);

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
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b12]" />}>
      <LazyCompositionAccessGate customAdminSlug={slug} />
    </Suspense>
  );
}
