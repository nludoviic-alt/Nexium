import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { RISK_DISCLAIMER } from "@/data/robots";

export const Route = createFileRoute("/risk-disclosure")({
  head: () => ({
    meta: [
      { title: "Avertissement sur les risques — Nexium-markets" },
      {
        name: "description",
        content:
          "Le trading automatisé comporte un risque élevé de perte en capital. Lisez l'avertissement complet avant d'utiliser un robot.",
      },
      { property: "og:title", content: "Avertissement sur les risques — Nexium-markets" },
      {
        property: "og:description",
        content: "Risque de perte en capital, effet de levier et limites du trading automatisé.",
      },
    ],
  }),
  component: RiskPage,
});

const points = [
  {
    title: "Risque de perte en capital",
    body: "Les produits à effet de levier peuvent entraîner la perte rapide de tout ou partie du capital investi. N'investissez jamais des fonds dont vous pourriez avoir besoin.",
  },
  {
    title: "Performances passées",
    body: "Les résultats historiques, backtests et statistiques de démonstration ne préjugent en rien des résultats futurs.",
  },
  {
    title: "Risques techniques",
    body: "Une coupure de connexion, un arrêt du terminal MetaTrader, une latence du broker ou un slippage peuvent modifier significativement l'exécution d'une stratégie automatisée.",
  },
  {
    title: "Responsabilité de l'utilisateur",
    body: "Les paramètres de risque, le dimensionnement des positions et la décision d'activer ou d'arrêter un robot restent sous votre entière responsabilité.",
  },
  {
    title: "Absence de conseil",
    body: "Nexium-markets fournit des outils logiciels et ne délivre aucun conseil en investissement ni recommandation personnalisée.",
  },
];

function RiskPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="GESTION DU RISQUE"
        title="Avertissement sur les Risques & l'Effet de Levier"
        description={RISK_DISCLAIMER}
      />
      <Section>
        <div className="mx-auto max-w-4xl space-y-6">
          {points.map((p) => (
            <div
              key={p.title}
              className="glass-card-dark rounded-3xl p-8 border border-gray-800 shadow-xl"
            >
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                {p.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-300 font-medium">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
