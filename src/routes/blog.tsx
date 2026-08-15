import { createFileRoute } from "@tanstack/react-router";

import { NotConfigured, PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Nexium Markets" },
      {
        name: "description",
        content:
          "Articles sur le trading automatisé, la gestion du risque et l'exploitation des robots MetaTrader 5.",
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const { language } = useLanguage();

  return (
    <PageShell>
      <PageHeader
        eyebrow={language === "fr" ? "ANALYSES & TÉLÉMÉTRIE" : "ANALYSIS & TELEMETRY"}
        title={language === "fr" ? "Comprendre le Trading Algorithmique" : "Understanding Algorithmic Trading"}
        description={
          language === "fr"
            ? "Articles et analyses sur l'exécution MetaTrader 5, la gestion du risque et le pilotage de vos robots depuis votre dashboard."
            : "In-depth articles and reports on MetaTrader 5 execution, risk governance, and quantitative strategy design."
        }
      />
      <Section>
        <NotConfigured>
          {language === "fr"
            ? "La publication d'articles sera connectée au module de veille hebdomadaire lors de la prochaine mise à jour."
            : "Weekly market intelligence publications will be available with the next scheduled CMS update."}
        </NotConfigured>
      </Section>
    </PageShell>
  );
}
