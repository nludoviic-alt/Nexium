import { createFileRoute } from "@tanstack/react-router";
import { AlertOctagon, Cpu, FileCheck, KeyRound, Lock, ShieldAlert } from "lucide-react";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Conditions Générales d'Utilisation & Licences — Nexium Markets" },
      {
        name: "description",
        content:
          "Conditions générales d'utilisation des licences de robots de trading MT5 Nexium Markets, obligations contractuelles et cadre de responsabilité.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { language, t } = useLanguage();

  const sections = [
    {
      icon: FileCheck,
      title: language === "fr" ? "1. Objet du Service & Statut Technologique" : "1. Service Scope & Technology Status",
      body:
        language === "fr"
          ? "Nexium Markets est un éditeur de logiciels fournissant une solution technologique de distribution, de validation de licences et de télémétrie pour Expert Advisors (EA) sur MetaTrader 5. Nexium Markets ne fournit aucun conseil financier, recommandation personnalisée ou gestion sous mandat."
          : "Nexium Markets is a software developer providing automated licensing, telemetry, and decision-support infrastructure for MetaTrader 5 Expert Advisors. Nexium Markets does not provide financial advisory services, discretionary asset management, or individual investment advice.",
    },
    {
      icon: KeyRound,
      title: language === "fr" ? "2. Octroi de Licence & Droits d'Utilisation" : "2. License Grant & Usage Rights",
      body:
        language === "fr"
          ? "L'abonnement souscrit confère à l'utilisateur un droit d'usage personnel, nominatif et non transférable, strictement limité au quota de comptes MT5 prévu par le forfait choisi (Starter, Pro ou Ultimate). Toute tentative de décompilation, de revente illicite ou de rétro-ingénierie entraîne la résiliation immédiate sans remboursement."
          : "Your subscription grants a non-exclusive, non-transferable, personal license limited to the authorized MT5 account quota of your tier (Starter, Pro, or Ultimate). Decompilation, illicit resale, or reverse-engineering attempts trigger immediate termination without refund.",
    },
    {
      icon: Lock,
      title: language === "fr" ? "3. Sécurité du Compte & Identifiants" : "3. Account Security & Credentials",
      body:
        language === "fr"
          ? "L'utilisateur est seul responsable de la sécurité de ses accès. Nexium Markets applique l'authentification à double facteur (2FA) et des protocoles de signature cryptographique pour chaque appel de validation de licence."
          : "Users maintain sole responsibility for access credential safety. Nexium Markets applies multi-factor authentication (2FA) and cryptographic signatures for each real-time licensing validation ping.",
    },
    {
      icon: AlertOctagon,
      title: language === "fr" ? "4. Absence de Garantie de Rendement" : "4. No Profit Guarantees",
      body:
        language === "fr"
          ? "Les performances passées d'un algorithme de trading ne préjugent en rien de ses performances futures. L'utilisateur demeure l'unique décideur de son exposition au risque, de son levier et de la taille de ses positions sur son propre compte de trading."
          : "Past trading algorithm results or backtest curves are not indicative of future performance. The user remains the sole decision-maker regarding account leverage, risk allocation, and position sizing.",
    },
    {
      icon: Cpu,
      title: language === "fr" ? "5. Disponibilité du Service & Infrastructure" : "5. Service Availability & Infrastructure",
      body:
        language === "fr"
          ? "Nexium Markets s'efforce de maintenir une disponibilité de 99.9% pour ses serveurs d'authentification situés chez Equinix NY4. Des interruptions programmées de maintenance peuvent survenir et font l'objet d'une notification préalable."
          : "Nexium Markets targets 99.9% uptime across its authentication server clusters at Equinix NY4. Scheduled maintenance windows are announced with prior notice on the status portal.",
    },
    {
      icon: ShieldAlert,
      title: language === "fr" ? "6. Limitation de Responsabilité & Force Majeure" : "6. Limitation of Liability & Force Majeure",
      body:
        language === "fr"
          ? "Nexium Markets ne peut être tenu responsable des pertes financières résultant de coupures Internet côté utilisateur, de défaillances de serveurs broker tiers, de slippage de marché lors d'annonces économiques majeures ou d'une mauvaise configuration manuelle des paramètres."
          : "Nexium Markets shall not be held liable for financial losses caused by local client connection drops, third-party broker outages, extreme high-impact news slippage, or improper parameter configuration.",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={language === "fr" ? "LÉGAL & CONFORMITÉ" : "LEGAL & COMPLIANCE"}
        title={t.legalPages.termsTitle}
        description={t.legalPages.termsSubtitle}
      />

      <Section>
        <div className="mx-auto max-w-4xl space-y-6">
          {sections.map((s) => (
            <div
              key={s.title}
              className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-xl"
            >
              <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66]">
                  <s.icon className="size-5" />
                </span>
                <h2 className="text-xl font-black text-white tracking-tight">{s.title}</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-300 font-medium">{s.body}</p>
            </div>
          ))}

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-xs text-gray-400">
            {language === "fr"
              ? "Document juridique d'adhésion contractuelle · Version v2.4 · Entrée en vigueur : 15 août 2026."
              : "Binding legal terms of service · Version v2.4 · Effective Date: August 15, 2026."}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
