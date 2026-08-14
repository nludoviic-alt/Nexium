import { createFileRoute } from "@tanstack/react-router";

import { NotConfigured, PageHeader, PageShell, Section } from "@/components/site/PageShell";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Nexium-markets" },
      {
        name: "description",
        content:
          "Articles sur le trading automatisé, la gestion du risque et l'exploitation des robots MetaTrader 5.",
      },
      { property: "og:title", content: "Blog — Nexium-markets" },
      {
        property: "og:description",
        content: "Trading automatisé, gestion du risque et bonnes pratiques MetaTrader 5.",
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="ANALYSES & TÉLÉMÉTRIE"
        title="Comprendre le Trading Algorithmique"
        description="Articles et analyses sur l'exécution MetaTrader 5, la gestion du risque et le pilotage de vos robots depuis votre dashboard."
      />
      <Section>
        <NotConfigured>
          La publication d'articles sera connectée au module CMS d'administration lors du
          déploiement du backend.
        </NotConfigured>
      </Section>
    </PageShell>
  );
}
