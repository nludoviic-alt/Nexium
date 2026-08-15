import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Cookie, Shield, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Politique des Cookies & Gestion des Traceurs — Nexium Markets" },
      {
        name: "description",
        content:
          "Découvrez comment Nexium Markets utilise les cookies pour assurer la sécurité de votre session, optimiser le dashboard et respecter votre vie privée.",
      },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  const { language, t } = useLanguage();

  const cookieTypes = [
    {
      icon: ShieldCheck,
      title: language === "fr" ? "1. Cookies Strictement Nécessaires (Obligatoires)" : "1. Strictly Necessary Cookies (Mandatory)",
      status: language === "fr" ? "Toujours Actifs" : "Always Active",
      essential: true,
      description:
        language === "fr"
          ? "Ces cookies sont indispensables au bon fonctionnement de la plateforme. Ils permettent de sécuriser l'authentification de votre compte, de maintenir votre session active sur le dashboard de trading MT5 et de prévenir les attaques CSRF."
          : "These cookies are indispensable for platform operations. They secure account authentication sessions, maintain real-time MT5 bridge telemetry, and prevent CSRF vulnerabilities.",
      examples:
        language === "fr"
          ? [
              "Token de session d'authentification chiffré (JWT)",
              "Prévention contre les fraudes et sécurité du compte",
              "Maintien de l'état de connexion ECN",
            ]
          : [
              "Encrypted JWT authentication session token",
              "Anti-fraud and account security tokens",
              "Live MT5 ECN connection bridge state",
            ],
    },
    {
      icon: Shield,
      title: language === "fr" ? "2. Cookies de Performance & Télémétrie" : "2. Performance & Telemetry Cookies",
      status: language === "fr" ? "Optionnels" : "Optional",
      essential: false,
      description:
        language === "fr"
          ? "Ils nous permettent de mesurer la latence réseau avec les serveurs Equinix NY4, d'évaluer le temps de chargement des flux de prix en direct et de détecter d'éventuelles anomalies d'affichage."
          : "These cookies measure network latency against Equinix NY4 servers, evaluate live price stream bandwidth, and detect UI rendering delays.",
      examples:
        language === "fr"
          ? [
              "Mesure de la latence tick et télémétrie serveur",
              "Statistiques anonymisées de navigation",
              "Rapports de crashs et stabilité applicative",
            ]
          : [
              "Tick latency & server telemetry metrics",
              "Anonymized navigation analytics",
              "Crash logging and application stability reports",
            ],
    },
    {
      icon: Cookie,
      title: language === "fr" ? "3. Cookies de Personnalisation & Préférences" : "3. Personalization & Preference Cookies",
      status: language === "fr" ? "Optionnels" : "Optional",
      essential: false,
      description:
        language === "fr"
          ? "Ces traceurs mémorisent vos préférences d'affichage (thème sombre, paires de devises favorites, configuration du panneau de trading)."
          : "These trackers remember your interface customizations (dark theme, favorite currency pairs, customized chart presets).",
      examples:
        language === "fr"
          ? [
              "Mémorisation du mode d'affichage des graphiques",
              "Sélection par défaut de la stratégie active",
              "Préférences linguistiques et régionales",
            ]
          : [
              "Chart display and timeframe presets",
              "Default active EA strategy selection",
              "Language and regional locale settings",
            ],
    },
  ];

  const handleSave = () => {
    toast.success(language === "fr" ? "Vos préférences ont été enregistrées." : "Your preferences have been saved.");
  };

  const handleAcceptAll = () => {
    toast.success(language === "fr" ? "Tous les cookies ont été acceptés." : "All cookies accepted.");
  };

  const handleRefuseOptional = () => {
    toast.info(language === "fr" ? "Seuls les cookies essentiels sont conservés." : "Only essential cookies are preserved.");
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow={language === "fr" ? "TRANSPARENCE & VIE PRIVÉE" : "PRIVACY & TRANSPARENCY"}
        title={t.legalPages.cookiesTitle}
        description={t.legalPages.cookiesSubtitle}
      />

      <Section>
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#00ff66]">
                  {language === "fr" ? "CENTRE DE GESTION DU CONSENTEMENT" : "CONSENT MANAGEMENT CENTER"}
                </span>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {language === "fr" ? "Vos Préférences en Direct" : "Your Live Preferences"}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleRefuseOptional}
                  className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-gray-300 transition cursor-pointer"
                >
                  {language === "fr" ? "Refuser l'optionnel" : "Reject Optional"}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="neon-btn rounded-xl px-5 py-2.5 text-xs font-black text-black uppercase tracking-wider cursor-pointer hover:scale-105 transition-all"
                >
                  {language === "fr" ? "Tout Accepter" : "Accept All"}
                </button>
              </div>
            </div>

            <p className="mt-6 text-sm text-gray-300 leading-relaxed font-medium">
              {language === "fr"
                ? "Conformément à la réglementation européenne et aux recommandations de la CNIL, vous pouvez modifier à tout moment vos choix concernant le dépôt des traceurs non essentiels."
                : "In compliance with GDPR and international data protection standards, you can update your consent choices for non-essential trackers at any time."}
            </p>

            <div className="mt-8 space-y-6">
              {cookieTypes.map((c) => (
                <div
                  key={c.title}
                  className="rounded-2xl border border-white/10 bg-black/30 p-6 transition-all hover:border-white/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66]">
                        <c.icon className="size-5" />
                      </span>
                      <h3 className="text-base font-black text-white">{c.title}</h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black font-mono w-fit ${
                        c.essential
                          ? "bg-[#00ff66]/15 border border-[#00ff66]/40 text-[#00ff66]"
                          : "bg-white/10 border border-white/20 text-gray-300"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-gray-300 font-medium">
                    {c.description}
                  </p>

                  <div className="mt-4 border-t border-white/5 pt-3">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {language === "fr" ? "Exemples d'utilisation :" : "Usage Examples:"}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {c.examples.map((ex) => (
                        <li key={ex} className="flex items-center gap-2 text-xs text-gray-300">
                          <CheckCircle2 className="size-3.5 text-[#00ff66] shrink-0" />
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <button
                onClick={handleSave}
                className="neon-btn rounded-xl px-7 py-3 text-xs font-black uppercase tracking-wider text-black cursor-pointer hover:scale-105 transition-all"
              >
                {language === "fr" ? "Enregistrer mes choix" : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
