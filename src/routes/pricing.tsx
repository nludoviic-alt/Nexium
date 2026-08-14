import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

import { NotConfigured, PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Tarifs et abonnements — Nexium Markets" },
      {
        name: "description",
        content:
          "Plans Starter, Pro et Ultimate : nombre de robots, comptes MT5 autorisés, analytics et support.",
      },
      { property: "og:title", content: "Tarifs et abonnements — Nexium Markets" },
      {
        property: "og:description",
        content: "Choisissez le plan adapté au nombre de robots et de comptes MetaTrader 5.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { language } = useLanguage();

  const plans = [
    {
      name: "Starter",
      price: 49,
      highlight: false,
      description:
        language === "fr"
          ? "Pour démarrer avec un robot et un compte MT5."
          : "Ideal for starting with 1 robot and 1 MT5 account.",
      features:
        language === "fr"
          ? [
              "1 robot au choix",
              "1 compte MT5 autorisé",
              "Statistiques de base en direct",
              "Support par email 24/7",
            ]
          : [
              "1 Robot of choice",
              "1 Authorized MT5 account",
              "Standard live statistics",
              "24/7 Email support",
            ],
    },
    {
      name: "Pro",
      price: 99,
      highlight: true,
      description:
        language === "fr"
          ? "Pour piloter plusieurs robots et comptes."
          : "For running multiple robots and accounts.",
      features:
        language === "fr"
          ? [
              "3 robots au choix",
              "3 comptes MT5 autorisés",
              "Analytics complet & Télémétrie",
              "Notifications dashboard et email",
              "Support prioritaire sous 2h",
            ]
          : [
              "3 Robots of choice",
              "3 Authorized MT5 accounts",
              "Full Analytics & Telemetry",
              "Dashboard & Email alerts",
              "Priority support under 2h",
            ],
    },
    {
      name: "Ultimate",
      price: 199,
      highlight: false,
      description:
        language === "fr"
          ? "Pour une utilisation intensive et multi-comptes."
          : "For intensive prop trading and multi-accounts.",
      features:
        language === "fr"
          ? [
              "Tous les robots de la gamme",
              "10 comptes MT5 autorisés",
              "Analytics avancé et export CSV",
              "Alertes robot hors ligne instantanées",
              "Support dédié & Account Manager",
            ]
          : [
              "All robots included (Full Access)",
              "10 Authorized MT5 accounts",
              "Advanced analytics & CSV export",
              "Instant disconnect alerts",
              "Dedicated Account Manager",
            ],
    },
  ];

  const featureMatrix = [
    {
      feature: language === "fr" ? "Robots MT5 inclus" : "Included MT5 Robots",
      starter: "1 Robot",
      pro: "3 Robots",
      ultimate: language === "fr" ? "Tous les Robots (Accès Total)" : "All Robots (Full Access)",
    },
    {
      feature: language === "fr" ? "Comptes MT5 Autorisés" : "Authorized MT5 Accounts",
      starter: "1 Compte",
      pro: "3 Comptes",
      ultimate: "10 Comptes simultanés",
    },
    {
      feature: language === "fr" ? "Télémétrie & Heartbeat 60s" : "Telemetry & 60s Heartbeat",
      starter: "Oui",
      pro: "Oui (Prioritaire)",
      ultimate: "Oui (Priorité Haute)",
    },
    {
      feature: language === "fr" ? "Export CSV / PDF des Trades" : "CSV/PDF Export",
      starter: "Non",
      pro: "Oui",
      ultimate: "Oui (API Directe)",
    },
    {
      feature: language === "fr" ? "Alertes Déconnexion / Risque" : "Risk / Disconnect Alerts",
      starter: "Email",
      pro: "Email & Dashboard",
      ultimate: "SMS, Email & Telegram",
    },
    {
      feature: language === "fr" ? "VPS NY4 Optimisé" : "Optimized NY4 VPS",
      starter: language === "fr" ? "En option" : "Optional",
      pro: language === "fr" ? "Inclus" : "Included",
      ultimate: language === "fr" ? "Inclus (Ultra-Low Latency)" : "Included (Ultra-Low Latency)",
    },
    {
      feature: language === "fr" ? "Support Technique" : "Technical Support",
      starter: "Email (24h)",
      pro: "Prioritaire (<2h)",
      ultimate: "Account Manager Dédié",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={language === "fr" ? "TARIFICATION TRANSPARENTE" : "TRANSPARENT PRICING"}
        title={
          language === "fr"
            ? "Des Formules Simples pour Piloter Vos Robots MT5"
            : "Simple Plans to Control Your MT5 Robots"
        }
        description={
          language === "fr"
            ? "Choisissez la formule adaptée au nombre de robots et de comptes MT5 que vous souhaitez automatiser, sans frais cachés."
            : "Select the subscription tailored to your number of Expert Advisors and MT5 accounts, with zero hidden fees."
        }
      />

      {/* Top Section - Glowing Dark Cards for Pricing Plans */}
      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-3xl flex flex-col p-8 transition-all duration-300 relative ${
                p.highlight
                  ? "bg-[#061911]/95 border-2 border-[#00D084] shadow-[0_10px_35px_rgba(0,208,132,0.22)] scale-105 z-10 hover:-translate-y-1"
                  : "bg-[#081510]/90 border border-[#00D084]/20 hover:border-[#00D084]/50 shadow-xl hover:-translate-y-1"
              }`}
            >
              {p.highlight ? (
                <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#00D084]/40 bg-[#00D084]/15 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-[#00D084] shadow-[0_0_12px_rgba(0,208,132,0.2)]">
                  <span className="size-2 rounded-full bg-[#00D084] animate-pulse" />
                  {language === "fr" ? "LE PLUS POPULAIRE" : "MOST POPULAR"}
                </span>
              ) : null}
              <h2 className="text-2xl font-black text-white">{p.name}</h2>
              <p className="mt-2 text-sm text-gray-300 font-medium">{p.description}</p>
              <p className="tabular mt-6 text-5xl font-black text-white">
                ${p.price}
                <span className="text-base font-medium text-gray-400">
                  {language === "fr" ? "/mois" : "/mo"}
                </span>
              </p>
              <ul className="mt-8 flex-1 space-y-3.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <div className="flex size-5 items-center justify-center rounded-full bg-[#00D084]/20 text-[#00D084] shrink-0">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                    <span className="text-gray-200 font-medium">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-8 rounded-2xl py-4 text-sm font-black uppercase tracking-wider transition-all hover:scale-105 cursor-pointer ${
                  p.highlight
                    ? "neon-btn text-[#021a11]"
                    : "border border-gray-700 bg-gray-900 text-white hover:bg-gray-800 hover:border-gray-600"
                }`}
              >
                <Link to="/register">
                  {language === "fr" ? "Commencer Maintenant" : "Start Now"}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <NotConfigured>
            {language === "fr"
              ? "L'intégration du paiement et de la facturation récurrente arrive avec le déploiement du backend. Les environnements de démonstration restent accessibles dès la création de votre compte."
              : "Payment and recurring billing integration will arrive with the backend deployment. Demo environments remain available upon registration."}
          </NotConfigured>
        </div>
      </Section>

      {/* Main Bright Modern Light Section */}
      <section className="bg-[#f8f9fc] py-16 px-4 border-t border-b border-gray-200 text-gray-900">
        <div className="mx-auto max-w-6xl space-y-16">
          {/* Feature Matrix Table */}
          <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-gray-200/90 shadow-sm overflow-hidden">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-extrabold text-[#059669] uppercase tracking-widest flex items-center gap-2">
                <Zap className="size-4" />
                <span>{language === "fr" ? "COMPARATIF DES OFFRES" : "OFFER COMPARISON"}</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
                {language === "fr"
                  ? "Comparatif Détaillé des Inclusions"
                  : "Detailed Inclusions Comparison"}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-4 px-4">{language === "fr" ? "Fonctionnalité" : "Feature"}</th>
                    <th className="py-4 px-4">Starter ($49)</th>
                    <th className="py-4 px-4 text-[#059669]">Pro ($99)</th>
                    <th className="py-4 px-4">Ultimate ($199)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {featureMatrix.map((row) => (
                    <tr key={row.feature} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-4 font-black text-gray-900">{row.feature}</td>
                      <td className="py-4 px-4 text-gray-600 font-semibold">{row.starter}</td>
                      <td className="py-4 px-4 text-[#059669] font-extrabold">{row.pro}</td>
                      <td className="py-4 px-4 text-gray-900 font-black">{row.ultimate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transparent Guarantee Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[28px] p-7 border border-gray-200/90 shadow-sm space-y-3">
              <div className="size-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
                <ShieldCheck className="size-5" />
              </div>
              <h4 className="text-lg font-black text-gray-900">
                {language === "fr" ? "Essai Gratuit 14 Jours" : "14-Day Free Trial"}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                {language === "fr"
                  ? "Testez l'ensemble de notre infrastructure et robots sans engagement. Annulation en un clic depuis votre espace."
                  : "Test our entire infrastructure and robots without commitment. One-click cancellation from your space."}
              </p>
            </div>

            <div className="bg-white rounded-[28px] p-7 border border-gray-200/90 shadow-sm space-y-3">
              <div className="size-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="size-5" />
              </div>
              <h4 className="text-lg font-black text-gray-900">
                {language === "fr" ? "Sans Engagement" : "No Commitment"}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                {language === "fr"
                  ? "Tous les abonnements sont mensuels et résiliables à tout moment sans aucun frais de sortie ni pénalité."
                  : "All subscriptions are monthly and cancelable at any time without exit fees or penalties."}
              </p>
            </div>

            <div className="bg-white rounded-[28px] p-7 border border-gray-200/90 shadow-sm space-y-3">
              <div className="size-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Zap className="size-5" />
              </div>
              <h4 className="text-lg font-black text-gray-900">
                {language === "fr" ? "Activation Instantanée" : "Instant Activation"}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                {language === "fr"
                  ? "Vos clés de licence et fichiers Expert Advisor sont générés immédiatement dès la validation de votre compte."
                  : "Your license keys and Expert Advisor files are generated immediately upon account validation."}
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="rounded-[32px] bg-gradient-to-r from-[#021f14] via-[#02180f] to-[#01110a] p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl border border-[#00D084]/25 relative overflow-hidden">
            <div className="relative z-10 space-y-3 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00D084]">
                <ShieldCheck className="size-4.5" />
                <span>{language === "fr" ? "PRÊT À DÉPLOYER ?" : "READY TO DEPLOY?"}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {language === "fr" ? "Rejoignez les traders institutionnels" : "Join Institutional Traders"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                {language === "fr"
                  ? "Créez votre compte en moins de 2 minutes et connectez vos terminaux MetaTrader 5 à notre pont réseau."
                  : "Create your account in under 2 minutes and link your MetaTrader 5 terminals to our network bridge."}
              </p>
            </div>

            <Button
              asChild
              className="relative z-10 neon-btn rounded-2xl px-8 py-4 text-sm font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 shrink-0 cursor-pointer text-[#021a11]"
            >
              <Link to="/register" className="flex items-center gap-2">
                <span>{language === "fr" ? "Créer Mon Compte Maintenant" : "Create My Account Now"}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
