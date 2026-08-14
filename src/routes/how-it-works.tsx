import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  UserPlus,
  Bot,
  Link2,
  KeyRound,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from "lucide-react";

import { PageHeader, PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "Comment ça marche — Quick Start | Nexium Markets" },
      {
        name: "description",
        content:
          "De la création du compte à l'activation de la licence : les 5 étapes pour connecter un robot MetaTrader 5 à votre dashboard.",
      },
      { property: "og:title", content: "Comment ça marche — Nexium Markets" },
      {
        property: "og:description",
        content: "Compte, robot, connexion MT5, licence, suivi : le parcours complet.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const steps = [
  {
    n: "01",
    title: "Créer votre compte",
    text: "Inscription gratuite en 2 minutes par email, vérification de sécurité puis accès immédiat à votre espace client.",
    icon: UserPlus,
    tag: "Inscription",
  },
  {
    n: "02",
    title: "Choisir votre robot EA",
    text: "Comparez les stratégies, actifs (Forex, Or, Indices), timeframes et niveaux de risque du catalogue.",
    icon: Bot,
    tag: "Catalogue",
  },
  {
    n: "03",
    title: "Connecter votre compte MT5",
    text: "Renseignez votre broker, serveur et numéro de compte. Votre mot de passe principal ne vous sera jamais demandé.",
    icon: Link2,
    tag: "Connexion",
  },
  {
    n: "04",
    title: "Activer votre licence",
    text: "Installez l'Expert Advisor dans MetaTrader 5. Saisissez votre clé unique pour lier la licence au compte autorisé.",
    icon: KeyRound,
    tag: "Activation",
  },
  {
    n: "05",
    title: "Suivre la télémétrie en direct",
    text: "Visualisez en temps réel le statut de connexion de votre robot, vos positions ouvertes, l'équité et le PnL net.",
    icon: Activity,
    tag: "Monitoring",
  },
];

const architecture = [
  {
    step: "01",
    name: "MetaTrader 5 Terminal",
    desc: "Exécution des ordres sur votre terminal de trading.",
  },
  {
    step: "02",
    name: "Bridge Sécurisé Co-localisé",
    desc: "Passerelle ultra-faible latence (<38ms) chez Equinix NY4.",
  },
  {
    step: "03",
    name: "API Applicative Authentifiée",
    desc: "Validation continue par clés de chiffrement uniques.",
  },
  {
    step: "04",
    name: "Base de Données Télémétrie",
    desc: "Horodatage et enregistrement des signaux de présence.",
  },
  {
    step: "05",
    name: "Dashboard Nexium Client",
    desc: "Rendu visuel et contrôle du risque sur votre espace portal.",
  },
];

function HowItWorksPage() {
  return (
    <PageShell>
      {/* Original Hero Component */}
      <PageHeader
        eyebrow="ARCHITECTURE EQUINIX NY4"
        title="Une Architecture d'Exécution Institutionnelle"
        description="Notre passerelle en fibre optique connecte directement votre terminal MetaTrader 5 aux fournisseurs de liquidité, pour une exécution sous 40ms."
      />

      {/* Main Bright Modern Light Section */}
      <section className="bg-[#f8f9fc] py-16 px-4 border-t border-b border-gray-200/80">
        <div className="mx-auto max-w-6xl space-y-16">
          {/* Section 1: Detailed 5-Step Premium Cards */}
          <div>
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-extrabold text-[#00c853] uppercase tracking-widest flex items-center gap-2">
                <Zap className="size-4" />
                <span>PARCOURS D'ACTIVATION</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-1">
                Le Parcours d'Activation en 5 Étapes
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600 font-medium">
                Un processus optimisé sans friction pour déployer vos robots EA en moins de 10
                minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.n}
                    className="bg-white rounded-[28px] p-8 border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300 hover:-translate-y-1.5 relative group overflow-hidden flex flex-col justify-between"
                  >
                    {/* Top Right Decorative Shape */}
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-50 via-emerald-50/30 to-transparent rounded-bl-[40px] pointer-events-none group-hover:scale-110 transition-transform duration-300" />

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-block rounded-full bg-emerald-50 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 border border-emerald-100 shadow-2xs">
                          Étape {s.n}
                        </span>
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200/60 flex items-center justify-center text-[#00c853] shadow-inner group-hover:scale-110 transition-transform duration-300">
                          <Icon className="size-5" />
                        </div>
                      </div>

                      <h3 className="mt-6 text-xl font-extrabold text-gray-900 tracking-tight leading-snug group-hover:text-emerald-900 transition-colors">
                        {s.title}
                      </h3>
                      <p className="mt-3 text-xs sm:text-sm leading-relaxed text-gray-600 font-medium">
                        {s.text}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                      <span className="uppercase tracking-wider font-mono text-[11px] text-gray-400">
                        MODULE {s.tag}
                      </span>
                      <div className="flex items-center gap-1.5 text-[#00c853]">
                        <CheckCircle2 className="size-4" />
                        <span className="text-[11px] font-extrabold">PRÊT</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Pipeline Visual Flow Cards - DARK BACKGROUND CONTAINER */}
          <div className="bg-[#030f07] rounded-[32px] p-8 sm:p-10 border border-[#00ff66]/25 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 size-72 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00ff66]/15 via-transparent to-transparent pointer-events-none" />

            <div className="max-w-2xl mb-10 relative z-10">
              <span className="text-xs font-extrabold text-[#00ff66] uppercase tracking-widest flex items-center gap-2">
                <Zap className="size-4" />
                <span>PIPELINE DE TÉLÉMÉTRIE FIX API</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Flux d'Exécution & Latence Minimales
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
              {architecture.map((a, i) => (
                <div
                  key={a.step}
                  className="bg-[#061c0d]/90 rounded-2xl p-5 border border-[#00ff66]/20 hover:border-[#00ff66]/60 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,102,0.2)] hover:-translate-y-1 flex flex-col justify-between relative group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-mono text-[#00ff66] bg-[#00ff66]/15 border border-[#00ff66]/30 px-2.5 py-1 rounded-lg shadow-[0_0_10px_rgba(0,255,102,0.2)]">
                        {a.step}
                      </span>
                      <span className="size-2 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66]" />
                    </div>
                    <h4 className="mt-4 text-sm font-extrabold text-white leading-snug group-hover:text-[#00ff66] transition-colors">
                      {a.name}
                    </h4>
                    <p className="mt-2 text-[11px] leading-relaxed text-gray-300 font-medium">
                      {a.desc}
                    </p>
                  </div>
                  {i < architecture.length - 1 && (
                    <div className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 bg-[#030f07] p-1.5 rounded-full border border-[#00ff66]/40 text-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.3)] group-hover:scale-110 transition-all">
                      <ArrowRight className="size-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Bank-Grade Security Institutional Card */}
          <div className="rounded-[32px] bg-gradient-to-r from-[#012812] via-[#011d0d] to-[#001409] p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl border border-[#00ff66]/25 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-[#00ff66]/15 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-4 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00ff66]">
                <ShieldCheck className="size-4.5" />
                <span>SÉCURITÉ INSTITUTIONNELLE GARANTIE</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Architecture de Sécurité Bancaire
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                Nexium Markets ne demande jamais le mot de passe principal de votre compte de
                trading. Seuls le serveur, le numéro de compte et les clés de colocalisation sont
                transmis. Tous les signaux sont signés numériquement et horodatés.
              </p>
            </div>

            <Button
              asChild
              className="relative z-10 bg-[#00ff66] text-black hover:bg-[#00e65c] rounded-2xl px-9 py-4.5 text-sm font-black uppercase tracking-wider transition-all duration-300 shadow-[0_0_25px_rgba(0,255,102,0.45)] hover:scale-105 shrink-0"
            >
              <Link to="/register" className="flex items-center gap-2">
                <span>Créer mon Compte Client</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
