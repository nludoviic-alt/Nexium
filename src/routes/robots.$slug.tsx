import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  CheckCircle2,
} from "lucide-react";

import { DemoBadge, PageShell, Section } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { RISK_DISCLAIMER, getRobot } from "@/data/robots";

export const Route = createFileRoute("/robots/$slug")({
  loader: ({ params }) => {
    const robot = getRobot(params.slug);
    if (!robot) throw notFound();
    return { robot };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Robot introuvable — Nexium Markets" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { robot } = loaderData;
    const description = robot.shortDescription;
    return {
      meta: [
        { title: `${robot.name} — Robot MetaTrader 5 | Nexium Markets` },
        { name: "description", content: description },
        { property: "og:title", content: `${robot.name} — ${robot.tagline}` },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: RobotNotFound,
  component: RobotDetail,
});

function RobotNotFound() {
  return (
    <PageShell>
      <Section className="text-center py-24">
        <h1 className="text-3xl font-black text-white">Robot introuvable</h1>
        <p className="mt-3 text-gray-400 font-medium">
          Ce robot n'existe pas ou n'est plus disponible au catalogue.
        </p>
        <Button
          asChild
          className="mt-6 bg-[#00ff66] text-black hover:bg-[#00e65c] rounded-2xl px-8 py-3 font-black"
        >
          <Link to="/robots">Retour au Catalogue Robots</Link>
        </Button>
      </Section>
    </PageShell>
  );
}

function RobotDetail() {
  const { robot } = Route.useLoaderData();
  const s = robot.demoStats;

  const stats = [
    { label: "Trades Totaux", value: s.trades.toString() },
    { label: "Taux de Réussite %", value: `${s.winRate.toFixed(1)}%` },
    { label: "Facteur de Profit", value: s.profitFactor.toFixed(2) },
    { label: "Drawdown Maximum", value: `${s.maxDrawdown.toFixed(1)}%` },
    { label: "Gain Moyen", value: `$${s.avgWin.toFixed(2)}` },
    { label: "Perte Moyenne", value: `$${s.avgLoss.toFixed(2)}` },
  ];

  return (
    <PageShell>
      {/* Dark Hero Section for Robot Detail */}
      <section className="relative w-full bg-gradient-to-b from-[#020d05] via-[#04190c] to-[#020d05] py-16 sm:py-20 border-b border-[#00ff66]/20 text-white overflow-hidden">
        <div className="absolute top-0 right-0 size-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00ff66]/15 via-transparent to-transparent pointer-events-none" />

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 relative z-10">
          <div className="flex flex-wrap gap-2">
            {robot.categories.map((c) => (
              <span
                key={c}
                className="rounded-full border border-[#00ff66]/40 bg-[#00ff66]/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.2)]"
              >
                {c}
              </span>
            ))}
            <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-mono font-black text-gray-300">
              BUILD v{robot.version}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
            {robot.name}
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-gray-300 font-medium max-w-2xl">
            {robot.tagline}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#00ff66] text-black hover:bg-[#00e65c] rounded-2xl px-9 py-4 text-sm font-black uppercase tracking-wider shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:scale-105"
            >
              <Link to="/register">
                <span>Déployer la Licence EA</span>
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border-white/15 bg-white/5 px-8 py-4 text-sm font-black text-white hover:bg-white/10"
            >
              <a href="#features">Spécifications Techniques</a>
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Tarif Mensuel", value: `$${robot.priceMonthly} / mois` },
              { label: "Plateforme", value: robot.platform },
              {
                label: "Statut Déploiement",
                value: robot.status === "BETA" ? "Build Bêta" : "Release Certifiée",
              },
              { label: "Version Actuelle", value: `v${robot.version}` },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-[#05170b]/90 rounded-2xl p-5 border border-[#00ff66]/20 shadow-md"
              >
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {k.label}
                </dt>
                <dd className="tabular mt-1.5 text-lg font-black text-white">{k.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Main Bright Canvas */}
      <section className="bg-[#f8f9fc] py-16 px-4 border-t border-b border-gray-200">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            {/* Left Content Area */}
            <div className="space-y-10">
              {/* Overview */}
              <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-gray-200/90 shadow-sm space-y-4">
                <span className="text-xs font-extrabold text-[#00c853] uppercase tracking-widest flex items-center gap-2">
                  <Zap className="size-4" />
                  <span>APERÇU ALGORITHMIQUE</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Description & Architecture
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                  {robot.longDescription}
                </p>
              </div>

              {/* Features List */}
              <div
                id="features"
                className="bg-white rounded-[32px] p-8 sm:p-10 border border-gray-200/90 shadow-sm space-y-6"
              >
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Fonctionnalités Algorithmiques
                </h2>
                <ul className="space-y-4">
                  {robot.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-sm sm:text-base text-gray-800 font-semibold"
                    >
                      <div className="flex size-6 items-center justify-center rounded-full bg-emerald-50 text-[#00c853] border border-emerald-100 shrink-0">
                        <Check className="size-4 stroke-[3]" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-gray-200/90 shadow-sm space-y-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Prérequis et Configuration Recommandée
                </h2>
                <ul className="space-y-4">
                  {robot.requirements.map((r) => (
                    <li
                      key={r}
                      className="flex items-center gap-3 text-sm sm:text-base text-gray-800 font-semibold"
                    >
                      <div className="flex size-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                        <FileText className="size-4" />
                      </div>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Changelog */}
              <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-gray-200/90 shadow-sm space-y-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Historique des Versions (Changelog)
                </h2>
                <div className="space-y-4">
                  {robot.changelog.map((c) => (
                    <div
                      key={c.version}
                      className="bg-gray-50 rounded-2xl p-6 border border-gray-200/70"
                    >
                      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                        <span className="font-mono text-base font-black text-[#00c853]">
                          Build v{c.version}
                        </span>
                        <span className="text-xs font-bold text-gray-400">{c.date}</span>
                      </div>
                      <p className="mt-3 text-xs sm:text-sm leading-relaxed text-gray-600 font-medium">
                        {c.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar Area */}
            <aside className="space-y-6">
              {/* Telemetry Glass Box */}
              <div className="bg-[#05170b]/95 rounded-[32px] p-8 border border-[#00ff66]/25 shadow-2xl space-y-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">Télémesure Live</h3>
                  <DemoBadge />
                </div>
                <p className="text-xs text-gray-300 font-medium">
                  Rapport de performance mesuré sur le serveur NY4.
                </p>

                <dl className="grid grid-cols-2 gap-4 border-t border-b border-white/10 py-6">
                  {stats.map((k) => (
                    <div key={k.label}>
                      <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {k.label}
                      </dt>
                      <dd className="tabular mt-1 text-base font-black text-[#00ff66]">
                        {k.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <CheckCircle2 className="size-4 text-[#00ff66]" />
                  <span>Synchronisation 60s active</span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-white rounded-[32px] p-8 border border-gray-200/90 shadow-sm space-y-6">
                <h3 className="text-xl font-black text-gray-900">Spécifications Techniques</h3>
                <dl className="space-y-4 text-xs sm:text-sm">
                  {[
                    { label: "Actifs Cibles", value: robot.assets.join(", ") },
                    { label: "Timeframes", value: robot.timeframes.join(", ") },
                    { label: "Stratégie", value: robot.strategy },
                    { label: "Profil de Risque", value: robot.riskLevel },
                    {
                      label: "Période d'Essai",
                      value: robot.trialDays ? `${robot.trialDays} Jours` : "N/A",
                    },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3"
                    >
                      <dt className="text-gray-500 font-semibold">{k.label}</dt>
                      <dd className="text-right font-black text-gray-900">{k.value}</dd>
                    </div>
                  ))}
                </dl>

                <Button
                  className="w-full rounded-2xl bg-gray-100 text-gray-400 py-3.5 text-xs font-black uppercase tracking-wider border border-gray-200 cursor-not-allowed"
                  disabled
                >
                  <Download className="size-4 mr-2 text-gray-400" />
                  Téléchargement Réservé aux Membres
                </Button>
              </div>
            </aside>
          </div>

          {/* Risk Disclaimer Box */}
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 text-xs leading-relaxed text-gray-500 font-medium shadow-xs">
            {RISK_DISCLAIMER}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
