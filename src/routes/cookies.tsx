import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Cookie, Shield, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Politique des Cookies & Gestion des Traceurs — Nexium Markets" },
      {
        name: "description",
        content:
          "Découvrez comment Nexium Markets utilise les cookies pour assurer la sécurité de votre session, optimiser le dashboard et respecter votre vie privée.",
      },
      { property: "og:title", content: "Politique des Cookies — Nexium Markets" },
      {
        property: "og:description",
        content: "Transparence totale et contrôle de vos préférences relatives aux cookies.",
      },
    ],
  }),
  component: CookiesPage,
});

const cookieTypes = [
  {
    icon: ShieldCheck,
    title: "1. Cookies Strictement Nécessaires (Obligatoires)",
    status: "Toujours Actifs",
    essential: true,
    description:
      "Ces cookies sont indispensables au bon fonctionnement de la plateforme. Ils permettent de sécuriser l'authentification de votre compte, de maintenir votre session active sur le dashboard de trading MT5 et de prévenir les attaques CSRF.",
    examples: [
      "Token de session d'authentification chiffré (JWT)",
      "Prévention contre les fraudes et sécurité du compte",
      "Maintien de l'état de connexion ECN",
    ],
  },
  {
    icon: Shield,
    title: "2. Cookies de Performance & Télémétrie",
    status: "Optionnels",
    essential: false,
    description:
      "Ils nous permettent de mesurer la latence réseau avec les serveurs Equinix NY4, d'évaluer le temps de chargement des flux de prix en direct et de détecter d'éventuelles anomalies d'affichage.",
    examples: [
      "Mesure de la latence tick et télémétrie serveur",
      "Statistiques anonymisées de navigation",
      "Rapports de crashs et stabilité applicative",
    ],
  },
  {
    icon: Cookie,
    title: "3. Cookies de Personnalisation & Préférences",
    status: "Optionnels",
    essential: false,
    description:
      "Ces traceurs mémorisent vos préférences d'affichage (thème sombre, paires de devises favorites, configuration du panneau de trading).",
    examples: [
      "Mémorisation du mode d'affichage des graphiques",
      "Sélection par défaut de la stratégie active",
      "Préférences linguistiques et régionales",
    ],
  },
];

function CookiesPage() {
  const [preferences, setPreferences] = useState({
    analytics: true,
    preferences: true,
  });

  const handleSave = () => {
    toast.success("Vos préférences de cookies ont été enregistrées avec succès.");
  };

  const handleAcceptAll = () => {
    setPreferences({ analytics: true, preferences: true });
    toast.success("Tous les cookies ont été acceptés.");
  };

  const handleRefuseOptional = () => {
    setPreferences({ analytics: false, preferences: false });
    toast.info("Seuls les cookies strictement nécessaires sont conservés.");
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="TRANSPARENCE & VIE PRIVÉE"
        title="Politique des Cookies & Traceurs"
        description="Nexium Markets applique les normes les plus strictes de protection de la vie privée (RGPD). Contrôlez précisément les traceurs utilisés lors de votre navigation."
      />

      <Section>
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Quick Preference Center Card */}
          <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#00ff66]">
                  CENTRE DE GESTION DU CONSENTEMENT
                </span>
                <h2 className="mt-1 text-2xl font-black text-white">Vos Préférences en Direct</h2>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleRefuseOptional}
                  className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-gray-300 transition cursor-pointer"
                >
                  Refuser l'optionnel
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="neon-btn rounded-xl px-5 py-2.5 text-xs font-black text-black uppercase tracking-wider cursor-pointer hover:scale-105 transition-all"
                >
                  Tout Accepter
                </button>
              </div>
            </div>

            <p className="mt-6 text-sm text-gray-300 leading-relaxed font-medium">
              Conformément à la réglementation européenne et aux recommandations de la CNIL, vous pouvez modifier à tout moment vos choix concernant le dépôt des traceurs non essentiels.
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
                      Exemples d'utilisation :
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
                Enregistrer mes choix
              </button>
            </div>
          </div>

          {/* Legal Explanations */}
          <div className="glass-card-dark rounded-3xl p-8 border border-white/10 space-y-4 text-xs leading-relaxed text-gray-400 font-medium">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Durée de conservation et suppression
            </h3>
            <p>
              Les cookies de session expirent automatiquement dès la fermeture de votre navigateur. Les cookies de consentement et de préférences sont conservés pour une durée maximale de 6 à 13 mois conformément aux directives légales en vigueur.
            </p>
            <p>
              Vous pouvez également configurer votre navigateur (Chrome, Firefox, Safari, Edge) pour bloquer l'ensemble des cookies ou recevoir une alerte avant leur enregistrement.
            </p>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
