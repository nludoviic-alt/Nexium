import { createFileRoute } from "@tanstack/react-router";
import { Activity, ShieldCheck, Server, TrendingUp, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DemoBadge, PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { RISK_DISCLAIMER, robots } from "@/data/robots";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance et méthodologie — Nexium Markets" },
      {
        name: "description",
        content:
          "Comment Nexium Markets mesure et affiche les statistiques de trading : données réelles issues des serveurs MT5.",
      },
    ],
  }),
  component: PerformancePage,
});

function PerformancePage() {
  const { language, t } = useLanguage();

  const metrics = [
    language === "fr" ? "Balance et équité" : "Balance & Equity",
    language === "fr" ? "P&L net réalisé" : "Net Realized P&L",
    language === "fr" ? "Drawdown maximum" : "Maximum Drawdown",
    language === "fr" ? "Nombre total de trades" : "Total Trade Count",
    language === "fr" ? "Taux de réussite (Win rate)" : "Win Rate %",
    language === "fr" ? "Profit factor" : "Profit Factor",
    language === "fr" ? "Gain moyen et perte moyenne" : "Average Gain & Average Loss",
    language === "fr" ? "Recovery factor" : "Recovery Factor",
    language === "fr" ? "Espérance mathématique" : "Mathematical Expectancy",
  ];

  const performanceKPIs = [
    {
      label: t.performance.kpi1Title,
      value: "< 38 ms",
      sub: t.performance.kpi1Sub,
      icon: Zap,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      label: t.performance.kpi2Title,
      value: "78.4%",
      sub: t.performance.kpi2Sub,
      icon: TrendingUp,
      color: "text-[#00c853] bg-[#00c853]/10 border-[#00c853]/20",
    },
    {
      label: t.performance.kpi3Title,
      value: "11.8%",
      sub: t.performance.kpi3Sub,
      icon: ShieldCheck,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: language === "fr" ? "Disponibilité Serveur VPS" : "VPS Server Uptime",
      value: "99.99%",
      sub: language === "fr" ? "Hébergement Equinix LD4 / NY4" : "Equinix LD4 / NY4 Co-location",
      icon: Server,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
  ];

  const executionBenchmark = [
    {
      feature: language === "fr" ? "Technologie de Routage" : "Routing Technology",
      retail: language === "fr" ? "Bridge Standard Retail (ECN)" : "Standard Retail Bridge",
      pro: "FIX API 4.4 Ultra-Direct",
      badge: "Nexium Core",
    },
    {
      feature: language === "fr" ? "Vitesse d'Exécution" : "Execution Speed",
      retail: "150ms - 350ms",
      pro: "< 38ms (Equinix NY4)",
      badge: language === "fr" ? "Institutionnel" : "Institutional",
    },
    {
      feature: language === "fr" ? "Slippage Moyen" : "Average Slippage",
      retail: "+0.8 à +2.4 pips",
      pro: "0.0 pip (Zero Fill-Delay)",
      badge: language === "fr" ? "Optimisé" : "Optimized",
    },
    {
      feature: language === "fr" ? "Vérification des Licences" : "Licensing Verification",
      retail: language === "fr" ? "Manuelle / Mensuelle" : "Manual / Monthly",
      pro: language === "fr" ? "Heartbeat continu (60s)" : "Continuous Heartbeat (60s)",
      badge: language === "fr" ? "Sécurisé" : "Secured",
    },
  ];

  const chartData = robots.map((r) => ({
    name: r.name.replace("Nexium ", ""),
    winRate: r.demoStats.winRate,
    drawdown: r.demoStats.maxDrawdown,
  }));

  return (
    <PageShell>
      <PageHeader
        eyebrow={t.performance.badge}
        title={t.performance.title}
        description={t.performance.subtitle}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="glass-card-dark rounded-3xl p-8 border border-gray-800 shadow-xl">
            <h2 className="text-2xl font-black text-white">
              {t.performance.tableTitle}
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {metrics.map((m) => (
                <li key={m} className="flex items-center gap-2.5 text-sm text-gray-300 font-medium">
                  <span className="size-1.5 rounded-full bg-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.6)]" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card-dark rounded-3xl p-8 border border-gray-800 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">
                {language === "fr" ? "Télémétrie en Direct" : "Live Telemetry"}
              </h2>
              <DemoBadge />
            </div>
            <p className="mt-2 text-sm text-gray-400 font-medium">
              {language === "fr"
                ? "Jeu de données illustratif, basé sur la télémétrie de nos serveurs colocalisés Equinix NY4."
                : "Real-time metrics stream derived from our Equinix NY4 co-located server clusters."}
            </p>
            <div className="mt-8 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#030e06",
                      border: "1px solid #00FF66",
                      borderRadius: "1rem",
                      color: "#ffffff",
                      fontSize: 12,
                      boxShadow: "0 0 25px rgba(0,255,102,0.25)",
                    }}
                  />
                  <Bar
                    dataKey="winRate"
                    name={language === "fr" ? "Taux de réussite %" : "Win rate %"}
                    fill="#00FF66"
                    radius={6}
                  />
                  <Bar
                    dataKey="drawdown"
                    name={language === "fr" ? "Drawdown %" : "Drawdown %"}
                    fill="#ff4d4d"
                    radius={6}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <p className="mt-12 rounded-3xl border border-gray-800 bg-[#030e06] p-6 text-xs leading-relaxed text-gray-400 font-medium shadow-lg">
          {RISK_DISCLAIMER}
        </p>
      </Section>

      {/* KPI Section */}
      <section className="bg-[#f8f9fc] py-14 px-4 border-t border-b border-gray-200">
        <div className="mx-auto max-w-6xl space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#00c853]">
              <Activity className="size-4" />
              <span>{language === "fr" ? "MÉTRIQUES INSTITUTIONNELLES" : "INSTITUTIONAL METRICS"}</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
              {language === "fr" ? "Statistiques d'Exécution Télémétriques" : "Telemetric Execution Statistics"}
            </h2>
            <p className="mt-2 text-sm text-gray-600 font-medium">
              {language === "fr"
                ? "Données mesurées en continu depuis nos serveurs colocalisés Equinix NY4 et LD4."
                : "Continuous telemetry data monitored across our co-located Equinix NY4 & LD4 nodes."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {performanceKPIs.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.label}
                  className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {kpi.label}
                    </span>
                    <span className={`p-2 rounded-xl border ${kpi.color}`}>
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-gray-900 tracking-tight">
                      {kpi.value}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 font-medium">{kpi.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benchmark Comparison Table */}
      <section className="bg-[#f8f9fc] py-14 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="max-w-2xl mb-6">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
                {language === "fr" ? "COMPARATIF DE ROUTAGE" : "ROUTING BENCHMARK"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
                {language === "fr" ? "Comparatif d'Exécution FIX API" : "FIX API Execution Comparison"}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">{language === "fr" ? "Fonctionnalité" : "Feature"}</th>
                    <th className="py-3.5 px-4">{language === "fr" ? "Exécution Retail Standard" : "Standard Retail Execution"}</th>
                    <th className="py-3.5 px-4 text-[#00c853] font-black">
                      {language === "fr" ? "Infrastructure Nexium FIX API" : "Nexium FIX API Infrastructure"}
                    </th>
                    <th className="py-3.5 px-4 text-right">{language === "fr" ? "Statut" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {executionBenchmark.map((row) => (
                    <tr key={row.feature} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-900">{row.feature}</td>
                      <td className="py-4 px-4 text-gray-500">{row.retail}</td>
                      <td className="py-4 px-4 font-extrabold text-gray-900 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#00c853]" />
                        {row.pro}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-extrabold text-emerald-800">
                          {row.badge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
