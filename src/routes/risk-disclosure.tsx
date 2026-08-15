import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { RISK_DISCLAIMER } from "@/data/robots";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/risk-disclosure")({
  head: () => ({
    meta: [
      { title: "Avertissement sur les risques — Nexium Markets" },
      {
        name: "description",
        content:
          "Le trading automatisé comporte un risque élevé de perte en capital. Lisez l'avertissement complet avant d'utiliser un robot.",
      },
    ],
  }),
  component: RiskPage,
});

function RiskPage() {
  const { language, t } = useLanguage();

  const points = [
    {
      title: language === "fr" ? "1. Risque de perte en capital" : "1. Capital Loss Risk",
      body:
        language === "fr"
          ? "Les instruments financiers négociés sur marge (Forex, CFD, Métaux, Indices) comportent un niveau de risque élevé et peuvent entraîner des pertes substantielles. N'investissez jamais des fonds que vous ne pouvez pas vous permettre de perdre."
          : "Leveraged financial instruments (Forex, CFDs, Commodities, Indices) involve substantial risk of capital loss. Never invest funds you cannot afford to lose entirely.",
    },
    {
      title: language === "fr" ? "2. Performances Passées & Backtests" : "2. Past Performance & Backtests",
      body:
        language === "fr"
          ? "Les résultats historiques, simulations et statistiques de backtests ne préjugent en rien des résultats futurs. Les conditions de liquidité et de volatilité de marché évoluent constamment."
          : "Historical results, tick backtests, and demo telemetry do not guarantee future profitability. Market liquidity, spreads, and volatility conditions fluctuate continuously.",
    },
    {
      title: language === "fr" ? "3. Risques Techniques & Latence Broker" : "3. Technical Risks & Broker Execution",
      body:
        language === "fr"
          ? "Une coupure de connexion locale, une interruption de VPS, des délais de réponse broker ou du slippage lors d'annonces de politique monétaire peuvent modifier l'exécution d'un algorithme."
          : "Local network drops, VPS power resets, broker liquidity gaps, or economic news slippage can significantly alter algorithmic order execution.",
    },
    {
      title: language === "fr" ? "4. Responsabilité & Paramétrage Utilisateur" : "4. User Responsibility & Risk Budget",
      body:
        language === "fr"
          ? "Le paramétrage du dimensionnement des lots, le choix du levier et la décision d'activer ou d'interrompre un Expert Advisor restent sous l'entière discrétion de l'utilisateur."
          : "Position sizing parameters, leverage selection, and the decision to start or halt an automated strategy remain under the user's sole discretion.",
    },
    {
      title: language === "fr" ? "5. Absence de Conseil en Investissement" : "5. No Financial Advice Disclaimer",
      body:
        language === "fr"
          ? "Nexium Markets est un éditeur de logiciels techniques et ne fournit aucune prestation de conseil financier, recommandation d'investissement personnalisée ou gestion sous mandat."
          : "Nexium Markets develops software technology tools and does not provide personalized investment advice, discretionary portfolio management, or brokerage services.",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={language === "fr" ? "GESTION DU RISQUE" : "RISK MANAGEMENT"}
        title={t.legalPages.riskTitle}
        description={RISK_DISCLAIMER}
      />
      <Section>
        <div className="mx-auto max-w-4xl space-y-6">
          {points.map((p) => (
            <div
              key={p.title}
              className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-xl"
            >
              <h2 className="text-lg font-black text-white">{p.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-300 font-medium">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
