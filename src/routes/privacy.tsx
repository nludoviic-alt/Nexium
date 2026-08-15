import { createFileRoute } from "@tanstack/react-router";
import { Database, EyeOff, FileText, Lock, ShieldCheck, UserCheck } from "lucide-react";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politique de Confidentialité & RGPD — Nexium Markets" },
      {
        name: "description",
        content:
          "Quelles données Nexium Markets collecte, pourquoi, durée de conservation, chiffrement des clés API MT5 et exercice de vos droits RGPD.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { language, t } = useLanguage();

  const sections = [
    {
      icon: Database,
      title: language === "fr" ? "1. Données Personnelles & Télémétrie Collectées" : "1. Personal Data & Telemetry Collected",
      body:
        language === "fr"
          ? "Nous collectons uniquement les données strictement nécessaires à l'exécution de vos algorithmes et à la gestion de vos licences : nom, adresse email, adresse IP de connexion, logs de session, identifiants publics de compte MT5 (numéro de compte et broker rattaché) et historique de facturation."
          : "We strictly collect data required for algorithmic execution and licensing operations: full name, email address, login IP address, session telemetry, MT5 public account numbers, broker names, and billing records.",
    },
    {
      icon: EyeOff,
      title: language === "fr" ? "2. Données Sensibles Strictement Non Collectées" : "2. Sensitive Credentials Strictly Never Collected",
      body:
        language === "fr"
          ? "Nexium Markets ne demande et ne stocke JAMAIS le mot de passe maître de votre compte MetaTrader 5, ni les coordonnées bancaires complètes de vos cartes de crédit (traitées de manière isolée via des passerelles de paiement PCI-DSS de niveau 1). Vos fonds restent sous la garde exclusive de votre broker."
          : "Nexium Markets NEVER asks for, transmits, or stores your master MetaTrader 5 trading password or complete credit card numbers (handled exclusively via PCI-DSS Level 1 payment gateways). Your funds remain strictly under your broker's custody.",
    },
    {
      icon: Lock,
      title: language === "fr" ? "3. Finalités du Traitement & Chiffrement" : "3. Processing Purposes & Encryption",
      body:
        language === "fr"
          ? "Vos données sont traitées pour : valider l'authenticité de vos licences d'Expert Advisors, assurer la communication sécurisée avec l'infrastructure Equinix NY4, calculer les métriques de performance en temps réel et sécuriser vos accès contre toute tentative d'intrusion."
          : "Your data is processed to: cryptographically validate EA licenses, maintain low-latency secure bridges to Equinix NY4 servers, compute real-time performance analytics, and safeguard your account against unauthorized access.",
    },
    {
      icon: FileText,
      title: language === "fr" ? "4. Durée de Conservation & Audit" : "4. Retention Period & Audit Logs",
      body:
        language === "fr"
          ? "Les données relatives à votre compte actif sont conservées pendant toute la durée de votre abonnement. Les logs techniques et de télémétrie sont automatiquement purgés après 90 jours glissants. Les pièces comptables sont archivées conformément aux durées légales obligatoires."
          : "Active account records are preserved throughout your subscription period. Technical session logs are automatically purged after 90 rolling days. Invoices and accounting records are archived as required by statutory law.",
    },
    {
      icon: UserCheck,
      title: language === "fr" ? "5. Vos Droits (Conformité RGPD & CCPA)" : "5. Your Rights (GDPR & CCPA Compliance)",
      body:
        language === "fr"
          ? "Conformément aux réglementations sur la protection des données personnelles, vous disposez d'un droit permanent d'accès, de rectification, de portabilité et de suppression intégrale de vos données. Ces demandes s'effectuent par simple email à privacy@nexiummarkets.com ou depuis votre espace support."
          : "Under GDPR and international privacy regulations, you have a perpetual right to access, rectify, export, and delete your personal data. Submit requests anytime via privacy@nexiummarkets.com or through your client support desk.",
    },
    {
      icon: ShieldCheck,
      title: language === "fr" ? "6. Sécurité de l'Infrastructure & Protocoles" : "6. Infrastructure Security & Protocols",
      body:
        language === "fr"
          ? "Toutes les transmissions entre votre terminal MT5 et nos serveurs sont protégées par un chiffrement TLS 1.3 de niveau militaire avec rotation continue des clés de session."
          : "All transmissions between your MT5 client terminal and our nodes are secured using military-grade TLS 1.3 encryption with rolling session keys.",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={language === "fr" ? "LÉGAL & CONFORMITÉ" : "LEGAL & COMPLIANCE"}
        title={t.legalPages.privacyTitle}
        description={t.legalPages.privacySubtitle}
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
              ? "Délégué à la Protection des Données (DPO) : "
              : "Data Protection Officer (DPO): "}
            <b className="text-white">privacy@nexiummarkets.com</b> · {language === "fr" ? "Dernière mise à jour : 15 août 2026." : "Last updated: August 15, 2026."}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
