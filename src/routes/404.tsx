import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/site/NotFoundPage";

export const Route = createFileRoute("/404")({
  head: () => ({
    meta: [
      { title: "Page Introuvable (404) — Nexium Markets" },
      {
        name: "description",
        content: "La page demandée est introuvable ou a été déplacée sur l'infrastructure Nexium Markets.",
      },
    ],
  }),
  component: NotFoundPage,
});

