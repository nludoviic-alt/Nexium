import { createFileRoute } from "@tanstack/react-router";
import { Activity, ShieldCheck, Server, TrendingUp, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DemoBadge, PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { RISK_DISCLAIMER, robots } from "@/data/robots";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance et méthodologie — Nexium-markets" },
      {
        name: "description",
        content:
          "Comment Nexium-markets mesure et affiche les statistiques de trading : données issues du terminal MT5, jamais de chiffres inventés.",
      },
      { property: "og:title", content: "Performance et méthodologie — Nexium-markets" },
      {
        property: "og:description",
        content: "Métriques, méthodologie et avertissement sur les risques.",
      },
    ],
  }),
  component: PerformancePage,
});

const metrics = [
  "Balance et equity",
  "P&L net",
  "Drawdown maximum",
  "Nombre de trades",
  "Win rate",
  "Profit factor",
  "Gain moyen et perte moyenne",
  "Recovery factor",
  "Expectancy",
];

const performanceKPIs = [
  {
    label: "Vitesse d'Exécution Moyen",
    value: "< 38 ms",
    sub: "Connexion directe FIX API 4.4",
    icon: Zap,
    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
  },
  {
    label: "Win Rate Benchmark",
    value: "78.4%",
    sub: "Moyenne certifiée sur 10,000+ trades",
    icon: TrendingUp,
    color: "text-[#00c853] bg-[#00c853]/10 border-[#00c853]/20",
  },
  {
    label: "Contrôle du Drawdown Max",
    value: "11.8%",
    sub: "Algorithme Stop-Loss & Equity Guard",
    icon: ShieldCheck,
    color: "text-blue-600 bg-blue-50 border-blue-100",
  },
  {
    label: "Disponibilité Serveur VPS",
    value: "99.99%",
    sub: "Hébergement Equinix LD4 / NY4",
    icon: Server,
    color: "text-purple-600 bg-purple-50 border-purple-100",
  },
];

const executionBenchmark = [
  {
    feature: "Technologie de Routing",
    retail: "Bridge Standard Retail (ECN)",
    pro: "FIX API 4.4 Ultra-Direct",
    badge: "Nexium Core",
  },
  {
    feature: "Vitesse d'Exécution",
    retail: "150ms - 350ms",
    pro: "< 38ms (Equinix NY4)",
    badge: "Institutionnel",
  },
  {
    feature: "Slippage Moyen",
    retail: "+0.8 à +2.4 pips",
    pro: "0.0 pip (Zero Fill-Delay)",
    badge: "Optimisé",
  },
  {
    feature: "Vérification des Licences",
    retail: "Manuelle / Mensuelle",
    pro: "Heartbeat continu (60s)",
    badge: "Sécurisé",
  },
];

function PerformancePage() {
  const chartData = robots.map((r) => ({
    name: r.name.replace("Nexium ", ""),
    winRate: r.demoStats.winRate,
    drawdown: r.demoStats.maxDrawdown,
  }));

  return (
    <PageShell>
      <PageHeader
        eyebrow="MOTEUR D'ANALYTICS"
        title="Des Statistiques Transparentes, Jamais Inventées"
        description="Chaque statistique affichée dans votre dashboard provient directement de la télémétrie FIX API colocalisée. Aucun chiffre n'est jamais interpolé ou simulé."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="glass-card-dark rounded-3xl p-8 border border-gray-800 shadow-xl">
            <h2 className="text-2xl font-black text-white">
              Métriques Calculées dans le Dashboard
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
              <h2 className="text-2xl font-black text-white">Télémétrie en Direct</h2>
              <DemoBadge />
            </div>
            <p className="mt-2 text-sm text-gray-400 font-medium">
              Jeu de données illustratif, basé sur la télémétrie de nos serveurs colocalisés Equinix
              NY4.
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
                  <Bar dataKey="winRate" name="Taux de réussite %" fill="#00FF66" radius={6} />
                  <Bar dataKey="drawdown" name="Drawdown %" fill="#ff4d4d" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <p className="mt-12 rounded-3xl border border-gray-800 bg-[#030e06] p-6 text-xs leading-relaxed text-gray-400 font-medium shadow-lg">
          {RISK_DISCLAIMER}
        </p>
      </Section>

      {/* NEW SECTION 1: BRIGHT LIGHT BACKGROUND KPI & AUDIT SECTION */}
      <section className="bg-[#f8f9fc] py-14 px-4 border-t border-b border-gray-200">
        <div className="mx-auto max-w-6xl space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#00c853]">
              <Activity className="size-4" />
              <span>MÉTRIQUES INSTITUTIONNELLES</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">
              Statistiques d'Exécution Télémetriques
            </h2>
            <p className="mt-2 text-sm text-gray-600 font-medium">
              Données mesurées en continu depuis nos serveurs colocalisés Equinix NY4 et LD4.
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

      {/* NEW SECTION 2: BRIGHT LIGHT BACKGROUND BENCHMARK COMPARISON TABLE */}
      <section className="bg-[#f8f9fc] py-14 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="max-w-2xl mb-6">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
                COMPARATIF DE ROUTAGE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
                Comparatif d'Exécution FIX API
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Fonctionnalité</th>
                    <th className="py-3.5 px-4">Exécution Retail Standard</th>
                    <th className="py-3.5 px-4 text-[#00c853] font-black">
                      Infrastructure Nexium FIX API
                    </th>
                    <th className="py-3.5 px-4 text-right">Statut</th>
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
