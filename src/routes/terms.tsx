import { createFileRoute } from "@tanstack/react-router";
import { AlertOctagon, Cpu, FileCheck, KeyRound, Lock, ShieldAlert } from "lucide-react";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Conditions Générales d'Utilisation & Licences — Nexium Markets" },
      {
        name: "description",
        content:
          "Conditions générales d'utilisation des licences de robots de trading MT5 Nexium Markets, obligations contractuelles et cadre de responsabilité.",
      },
      { property: "og:title", content: "Conditions Générales d'Utilisation — Nexium Markets" },
      { property: "og:description", content: "Cadre contractuel d'utilisation de la plateforme." },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    icon: FileCheck,
    title: "1. Objet du Service & Statut Technologique",
    body: "Nexium Markets est un éditeur de logiciels fournissant une solution technologique de distribution, de validation de licences et de télémétrie pour Expert Advisors (EA) sur MetaTrader 5. Nexium Markets ne fournit aucun conseil financier, recommandation personnalisée ou gestion sous mandat.",
  },
  {
    icon: KeyRound,
    title: "2. Octroi de Licence & Droits d'Utilisation",
    body: "L'abonnement souscrit confère à l'utilisateur un droit d'usage personnel, nominatif et non transférable, strictement limité au quota de comptes MT5 prévu par le forfait choisi (Starter, Pro ou Ultimate). Toute tentative de décompilation, de revente illicite ou de rétro-ingénierie entraîne la résiliation immédiate sans remboursement.",
  },
  {
    icon: Lock,
    title: "3. Sécurité du Compte & Identifiants",
    body: "L'utilisateur est seul responsable de la sécurité de ses accès. Nexium Markets applique l'authentification à double facteur (2FA) et des protocoles de signature cryptographique pour chaque appel de validation de licence.",
  },
  {
    icon: AlertOctagon,
    title: "4. Absence de Garantie de Rendement",
    body: "Les performances passées d'un algorithme de trading ne préjugent en rien de ses performances futures. L'utilisateur demeure l'unique décideur de son exposition au risque, de son levier et de la taille de ses positions sur son propre compte de trading.",
  },
  {
    icon: Cpu,
    title: "5. Disponibilité du Service & Infrastructure",
    body: "Nexium Markets s'efforce de maintenir une disponibilité de 99.9% pour ses serveurs d'authentification situés chez Equinix NY4. Des interruptions programmées de maintenance peuvent survenir et font l'objet d'une notification préalable.",
  },
  {
    icon: ShieldAlert,
    title: "6. Limitation de Responsabilité & Force Majeure",
    body: "Nexium Markets ne peut être tenu responsable des pertes financières résultant de coupures Internet côté utilisateur, de défaillances de serveurs broker tiers, de slippage de marché lors d'annonces économiques majeures ou d'une mauvaise configuration manuelle des paramètres.",
  },
];

function TermsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="LÉGAL & CONFORMITÉ"
        title="Conditions Générales d'Utilisation & Licences"
        description="Cadre contractuel régissant l'attribution des licences logicielles, la connectivité MT5 et les responsabilités d'usage de la plateforme."
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
            Document juridique d'adhésion contractuelle · Version v2.4 · Entrée en vigueur : 14 août 2026.
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
