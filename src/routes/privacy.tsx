import { createFileRoute } from "@tanstack/react-router";
import { Database, EyeOff, FileText, Lock, ShieldCheck, UserCheck } from "lucide-react";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politique de Confidentialité & RGPD — Nexium Markets" },
      {
        name: "description",
        content:
          "Quelles données Nexium Markets collecte, pourquoi, durée de conservation, chiffrement des clés API MT5 et exercice de vos droits RGPD.",
      },
      { property: "og:title", content: "Politique de Confidentialité — Nexium Markets" },
      { property: "og:description", content: "Traitement et protection rigoureuse de vos données." },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    icon: Database,
    title: "1. Données Personnelles & Télémétrie Collectées",
    body: "Nous collectons uniquement les données strictement nécessaires à l'exécution de vos algorithmes et à la gestion de vos licences : nom, adresse email, adresse IP de connexion, logs de session, identifiants publics de compte MT5 (numéro de compte et broker rattaché) et historique de facturation.",
  },
  {
    icon: EyeOff,
    title: "2. Données Sensibles Strictement Non Collectées",
    body: "Nexium Markets ne demande et ne stocke JAMAIS le mot de passe maître de votre compte MetaTrader 5, ni les coordonnées bancaires complètes de vos cartes de crédit (traitées de manière isolée via des passerelles de paiement PCI-DSS de niveau 1). Vos fonds restent sous la garde exclusive de votre broker.",
  },
  {
    icon: Lock,
    title: "3. Finalités du Traitement & Chiffrement",
    body: "Vos données sont traitées pour : valider l'authenticité de vos licences d'Expert Advisors, assurer la communication sécurisée avec l'infrastructure Equinix NY4, calculer les métriques de performance en temps réel et sécuriser vos accès contre toute tentative d'intrusion.",
  },
  {
    icon: FileText,
    title: "4. Durée de Conservation & Audit",
    body: "Les données relatives à votre compte actif sont conservées pendant toute la durée de votre abonnement. Les logs techniques et de télémétrie sont automatiquement purgés après 90 jours glissants. Les pièces comptables sont archivées conformément aux durées légales obligatoires.",
  },
  {
    icon: UserCheck,
    title: "5. Vos Droits (Conformité RGPD & CCPA)",
    body: "Conformément aux réglementations sur la protection des données personnelles, vous disposez d'un droit permanent d'accès, de rectification, de portabilité et de suppression intégrale de vos données. Ces demandes s'effectuent par simple email à privacy@nexium-markets.com ou depuis votre espace support.",
  },
  {
    icon: ShieldCheck,
    title: "6. Sécurité de l'Infrastructure & Protocoles",
    body: "Toutes les transmissions entre votre terminal MT5 et nos serveurs sont protégées par un chiffrement TLS 1.3 de niveau militaire avec rotation continue des clés de session.",
  },
];

function PrivacyPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="LÉGAL & CONFORMITÉ"
        title="Politique de Confidentialité & Protection des Données"
        description="Comment Nexium Markets collecte, chiffre, traite et protège les informations de votre compte et vos données de télémétrie en toute conformité RGPD."
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
            Délégué à la Protection des Données (DPO) : <b className="text-white">dpo@nexium-markets.com</b> · Dernière mise à jour : 14 août 2026.
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
