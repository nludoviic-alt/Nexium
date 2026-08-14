import { createFileRoute } from "@tanstack/react-router";
import { Building2, Globe, Mail, MapPin, Scale, Server, ShieldCheck } from "lucide-react";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Mentions Légales & Informations Éditeur — Nexium Markets" },
      {
        name: "description",
        content:
          "Mentions légales, informations sur l'éditeur, hébergeur des serveurs Equinix NY4 et propriété intellectuelle de Nexium Markets.",
      },
      { property: "og:title", content: "Mentions Légales — Nexium Markets" },
      { property: "og:description", content: "Informations légales et éditeur." },
    ],
  }),
  component: LegalPage,
});

const legalBlocks = [
  {
    icon: Building2,
    title: "1. Éditeur de la Plateforme",
    items: [
      { label: "Dénomination sociale", value: "Nexium Markets Technologies Ltd." },
      { label: "Forme juridique", value: "Société à Responsabilité Limitée Technologique" },
      { label: "Numéro d'immatriculation", value: "NX-89210-449" },
      { label: "Email de contact", value: "legal@nexium-markets.com" },
      { label: "Directeur de la publication", value: "Département Juridique & Conformité" },
    ],
  },
  {
    icon: Server,
    title: "2. Hébergement & Infrastructure Réseau",
    items: [
      { label: "Centre de données", value: "Equinix NY4 Financial IBX (Secaucus, NJ, USA)" },
      { label: "Hébergeur Cloud & SaaS", value: "Infrastructure Haute Disponibilité Cloudflare Inc. & AWS ECN" },
      { label: "Chiffrement réseau", value: "Protocole TLS 1.3 / SSL 256-bit avec flux FIX API sécurisé" },
    ],
  },
  {
    icon: Scale,
    title: "3. Activité & Cadre Réglementaire",
    content:
      "Nexium Markets est un éditeur de logiciels spécialisé dans l'automatisation du trading et les Expert Advisors pour MetaTrader 5. Nexium Markets n'agit pas en tant que courtier (broker), prestataire de services d'investissement (PSI) ou conseiller financier. La plateforme ne reçoit ni ne gère directement les fonds des utilisateurs.",
  },
  {
    icon: ShieldCheck,
    title: "4. Propriété Intellectuelle & Marques",
    content:
      "L'ensemble des algorithmes, codes sources MQL5, interfaces graphiques, logos, marques et documentations présents sur ce site sont la propriété exclusive de Nexium Markets Technologies Ltd. Toute reproduction, décompilation ou ingénierie inverse sans accord écrit préalable est strictement interdite.",
  },
  {
    icon: Globe,
    title: "5. Juridiction & Droit Applicable",
    content:
      "Les présentes mentions légales et l'utilisation de la plateforme sont régies par le droit international des services logiciels numériques. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire devant les tribunaux compétents.",
  },
];

function LegalPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="INFORMATIONS RÉGLEMENTAIRES"
        title="Mentions Légales & Éditeur"
        description="Informations légales relatives à la société éditrice, à l'hébergement de l'infrastructure Equinix NY4 et aux droits de propriété intellectuelle."
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
                <p className="mt-5 text-sm leading-relaxed text-gray-300 font-medium">
                  {block.content}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
