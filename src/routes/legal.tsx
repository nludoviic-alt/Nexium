import { createFileRoute } from "@tanstack/react-router";
import { Building2, Globe, Mail, MapPin, Scale, Server, ShieldCheck } from "lucide-react";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Mentions Légales & Informations Éditeur — Nexium Markets" },
      {
        name: "description",
        content:
          "Mentions légales, informations sur l'éditeur, hébergeur des serveurs Equinix NY4 et propriété intellectuelle de Nexium Markets.",
      },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  const { language, t } = useLanguage();

  const legalBlocks = [
    {
      icon: Building2,
      title: language === "fr" ? "1. Éditeur de la Plateforme" : "1. Platform Publisher",
      items: [
        { label: language === "fr" ? "Dénomination sociale" : "Corporate Name", value: "Nexium Markets Technologies Ltd." },
        { label: language === "fr" ? "Forme juridique" : "Legal Structure", value: language === "fr" ? "Société de Technologies Logicielles" : "Software Technology Corporation" },
        { label: language === "fr" ? "Numéro d'immatriculation" : "Registration Number", value: "NX-89210-449" },
        { label: language === "fr" ? "Email légal" : "Legal Email", value: "legal@nexiummarkets.com" },
        { label: language === "fr" ? "Directeur de la publication" : "Publishing Officer", value: language === "fr" ? "Département Juridique & Conformité" : "Legal & Compliance Directorate" },
      ],
    },
    {
      icon: Server,
      title: language === "fr" ? "2. Hébergement & Infrastructure Réseau" : "2. Network Hosting & Infrastructure",
      items: [
        { label: language === "fr" ? "Centre de données" : "Primary Datacenter", value: "Equinix NY4 Financial IBX (Secaucus, NJ, USA)" },
        { label: language === "fr" ? "Hébergeur Cloud & SaaS" : "Cloud & SaaS Backbone", value: "Cloudflare Inc. & AWS High-Availability ECN" },
        { label: language === "fr" ? "Chiffrement réseau" : "Network Encryption", value: "TLS 1.3 / SSL 256-bit with authenticated FIX API" },
      ],
    },
    {
      icon: Scale,
      title: language === "fr" ? "3. Activité & Cadre Réglementaire" : "3. Activity & Regulatory Scope",
      content:
        language === "fr"
          ? "Nexium Markets est un éditeur de logiciels spécialisé dans l'automatisation du trading et les Expert Advisors pour MetaTrader 5. Nexium Markets n'agit pas en tant que courtier (broker), prestataire de services d'investissement (PSI) ou conseiller financier. La plateforme ne reçoit ni ne gère directement les fonds des utilisateurs."
          : "Nexium Markets is a specialized software technology provider developing automated tools and Expert Advisors for MetaTrader 5. Nexium Markets does not act as a broker, custodian, or investment advisor. The platform never holds customer funds.",
    },
    {
      icon: ShieldCheck,
      title: language === "fr" ? "4. Propriété Intellectuelle & Marques" : "4. Intellectual Property & Trademarks",
      content:
        language === "fr"
          ? "L'ensemble des algorithmes, codes sources MQL5, interfaces graphiques, logos, marques et documentations présents sur ce site sont la propriété exclusive de Nexium Markets Technologies Ltd. Toute reproduction, décompilation ou ingénierie inverse sans accord écrit préalable est strictement interdite."
          : "All algorithmic models, MQL5 source code, visual interfaces, logos, and documentation on this platform are the exclusive intellectual property of Nexium Markets Technologies Ltd. Unauthorized reverse-engineering or reproduction is strictly prohibited.",
    },
    {
      icon: Globe,
      title: language === "fr" ? "5. Juridiction & Droit Applicable" : "5. Jurisdiction & Applicable Law",
      content:
        language === "fr"
          ? "Les présentes mentions légales et l'utilisation de la plateforme sont régies par le droit international des services logiciels numériques. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire devant les tribunaux compétents."
          : "These legal terms and platform access are governed by international digital software regulations. In the event of disputes, amicable resolution will precede any competent jurisdiction proceedings.",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={language === "fr" ? "INFORMATIONS RÉGLEMENTAIRES" : "REGULATORY DISCLOSURES"}
        title={t.legalPages.legalNoticeTitle}
        description={t.legalPages.legalNoticeSubtitle}
      />

      <Section>
        <div className="mx-auto max-w-4xl space-y-6">
          {legalBlocks.map((block) => (
            <div
              key={block.title}
              className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-xl"
            >
              <div className="flex items-center gap-3.5 border-b border-white/10 pb-5">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66]">
                  <block.icon className="size-5" />
                </span>
                <h2 className="text-xl font-black text-white tracking-tight">{block.title}</h2>
              </div>

              {block.items && (
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  {block.items.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-black/30 p-4 border border-white/5">
                      <dt className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        {item.label}
                      </dt>
                      <dd className="mt-1 font-mono text-xs font-bold text-white break-words">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {block.content && (
                <p className="mt-6 text-sm leading-relaxed text-gray-300 font-medium">{block.content}</p>
              )}
            </div>
          ))}

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-xs text-gray-400">
            {language === "fr"
              ? "Informations légales officielles · Version v2.4 · Dernière mise à jour : 15 août 2026."
              : "Official corporate disclosures · Version v2.4 · Last updated: August 15, 2026."}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
