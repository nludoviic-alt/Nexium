import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Zap, Cpu, Activity, ArrowRight, Lock, Sparkles, Search } from "lucide-react";

import { PageHeader, PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RISK_DISCLAIMER, robots } from "@/data/robots";
import { useLanguage } from "@/context/LanguageContext";

export const Route = createFileRoute("/robots/")({
  head: () => ({
    meta: [
      { title: "Robots MetaTrader 5 — Trilogie Algorithmique | Nexium Markets" },
      {
        name: "description",
        content:
          "Découvrez les 3 Expert Advisors phares de Nexium Markets pour MetaTrader 5. Licences Hardware-Bound & Colocalisation Equinix NY4 <38ms.",
      },
      {
        property: "og:title",
        content: "Robots MetaTrader 5 — Trilogie Algorithmique | Nexium Markets",
      },
      {
        property: "og:description",
        content:
          "Trilogie d'EA certifiés MT5 : scalping or, micro-scalping haute fréquence FIX API et breakout crypto.",
      },
    ],
  }),
  component: RobotsPage,
});

function RobotsPage() {
  const { language } = useLanguage();
  const categories = useMemo(
    () =>
      language === "fr"
        ? ["Tous", "Gold", "Scalping", "Crypto", "Forex", "Indices"]
        : ["All", "Gold", "Scalping", "Crypto", "Forex", "Indices"],
    [language]
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(categories[0] || "Tous");

  const filteredRobots = useMemo(() => {
    const isAll = category === "Tous" || category === "All";
    const result = robots.filter((r) => {
      const matchesQuery =
        !query ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.shortDescription.toLowerCase().includes(query.toLowerCase()) ||
        r.assets.some((a) => a.toLowerCase().includes(query.toLowerCase()));
      const matchesCategory = isAll || r.categories.some((c) => c.toLowerCase() === category.toLowerCase());
      return matchesQuery && matchesCategory;
    });

    return result.slice(0, 3);
  }, [query, category]);

  return (
    <PageShell>
      {/* 1. Header */}
      <PageHeader
        eyebrow={language === "fr" ? "TRILOGIE ALGORITHMIQUE MT5" : "MT5 ALGORITHMIC TRILOGY"}
        title={language === "fr" ? "Expert Advisors MetaTrader 5" : "MetaTrader 5 Expert Advisors"}
        description={
          language === "fr"
            ? "Une sélection strictement limitée aux 3 robots haute précision. Licences chiffrées Hardware-Bound et colocalisation Equinix NY4 (<38ms)."
            : "A strictly curated suite of 3 high-precision Expert Advisors. Hardware-bound licensing and Equinix NY4 collocation (<38ms)."
        }
      />

      {/* 2. Main Dark Showcase Canvas */}
      <section className="bg-[#030906] py-14 px-4 border-b border-[#00D084]/20 relative overflow-hidden text-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[650px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00D084]/12 via-transparent to-transparent pointer-events-none" />

        <div className="mx-auto max-w-6xl relative z-10 space-y-10">
          {/* Control Bar: Search & Category Chips */}
          <div className="bg-[#061911]/95 rounded-3xl p-6 border border-[#00D084]/25 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-4 top-3.5 size-4 text-[#00D084]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={language === "fr" ? "Rechercher (Or, Scalper, Crypto)..." : "Search (Gold, Scalper, Crypto)..."}
                className="w-full rounded-2xl border-[#00D084]/25 bg-black/40 px-11 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-[#00D084] focus:ring-1 focus:ring-[#00D084]"
              />
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    category === c
                      ? "bg-[#00D084] text-[#021a11] shadow-[0_0_12px_rgba(0,208,132,0.3)] scale-105"
                      : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Counter Badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-[#00D084]">
              <Sparkles className="size-3.5 animate-pulse" />
              <span>
                {filteredRobots.length} / 3 {language === "fr" ? "EA AFFICHÉS" : "EAs SHOWN"}
              </span>
            </div>
          </div>

          {/* THE 3 MASTER CARDS GRID (MAXIMUM 3 CARDS ONLY) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredRobots.map((r, index) => (
              <div
                key={r.slug}
                className="bg-[#061911]/95 rounded-[32px] p-8 border-2 border-[#00D084]/25 hover:border-[#00D084] transition-all duration-300 shadow-2xl hover:shadow-[0_10px_35px_rgba(0,208,132,0.18)] flex flex-col justify-between group relative overflow-hidden hover:-translate-y-2"
              >
                {/* Background Glow */}
                <div className="absolute top-0 right-0 size-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00D084]/15 via-transparent to-transparent pointer-events-none" />

                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#00D084]/10 border border-[#00D084]/35 text-[10px] font-mono font-black text-[#00D084]">
                      0{index + 1} / EA {r.categories[0]?.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/5 font-mono text-[10px] font-black text-gray-300 border border-white/10">
                      BUILD v{r.version}
                    </span>
                  </div>

                  {/* Robot Title & Strategy */}
                  <h3 className="mt-6 text-2xl font-black text-white group-hover:text-[#00D084] transition-colors">
                    {r.name}
                  </h3>
                  <p className="mt-2 text-xs font-bold text-[#00D084] uppercase tracking-wide">
                    {r.strategy}
                  </p>

                  {/* Target Assets */}
                  <div className="mt-6 flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-400 font-bold uppercase text-[10px] mr-1">
                      {language === "fr" ? "Actifs:" : "Assets:"}
                    </span>
                    {r.assets.map((a) => (
                      <span
                        key={a}
                        className="bg-white/10 border border-white/15 text-white px-2.5 py-0.5 rounded-lg font-mono font-bold text-[11px]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>

                  {/* Telemetry Stats Box */}
                  <div className="mt-6 grid grid-cols-3 gap-2 bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                        {language === "fr" ? "Réussite" : "Win Rate"}
                      </span>
                      <span className="text-base font-black text-[#00D084]">
                        {r.demoStats.winRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                        Drawdown Max
                      </span>
                      <span className="text-base font-black text-rose-400">
                        {r.demoStats.maxDrawdown}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                        {language === "fr" ? "Facteur" : "Profit Fact."}
                      </span>
                      <span className="text-base font-black text-white">
                        {r.demoStats.profitFactor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <Button
                    asChild
                    className="w-full neon-btn rounded-2xl py-3.5 text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer text-[#021a11]"
                  >
                    <Link
                      to="/robots/$slug"
                      params={{ slug: r.slug }}
                      className="flex items-center justify-center gap-2"
                    >
                      <span>
                        {language === "fr"
                          ? `Examiner la Fiche ${r.name}`
                          : `View Details for ${r.name}`}
                      </span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Bright Section: Infrastructure Standards & CTA */}
      <section className="bg-[#f8f9fc] py-14 px-4 border-t border-b border-gray-200 text-gray-900">
        <div className="mx-auto max-w-6xl space-y-12">
          {/* Infrastructure Security Guarantees */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-sm space-y-3 hover:shadow-md transition-all">
              <div className="size-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
                <Lock className="size-5" />
              </div>
              <h4 className="text-base font-black text-gray-900 tracking-tight">
                {language === "fr" ? "Licence Chiffrée Hardware-Bound" : "Hardware-Bound License"}
              </h4>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                {language === "fr"
                  ? "Verrouillage cryptographique par ID de terminal MT5 et compte de trading sans exposer vos clés principales."
                  : "Cryptographic locking by MT5 terminal ID and trading account without exposing primary keys."}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-sm space-y-3 hover:shadow-md transition-all">
              <div className="size-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Activity className="size-5" />
              </div>
              <h4 className="text-base font-black text-gray-900 tracking-tight">
                {language === "fr" ? "Heartbeat & Télémesure 60s" : "60s Heartbeat & Telemetry"}
              </h4>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                {language === "fr"
                  ? "Supervision en temps réel avec remontée automatique du statut de connexion et des alertes d'exécution."
                  : "Real-time supervision with automated connection status reporting and execution alerts."}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-gray-200/80 shadow-sm space-y-3 hover:shadow-md transition-all">
              <div className="size-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Zap className="size-5" />
              </div>
              <h4 className="text-base font-black text-gray-900 tracking-tight">
                {language === "fr" ? "Colocalisation Equinix NY4" : "Equinix NY4 Collocation"}
              </h4>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                {language === "fr"
                  ? "Configurations pré-optimisées pour les VPS colocalisés dans le centre de données d'Equinix à New York."
                  : "Pre-optimized setups for VPS colocated in Equinix New York data centers."}
              </p>
            </div>
          </div>

          {/* Custom EA Banner */}
          <div className="rounded-[32px] bg-gradient-to-r from-[#021f14] via-[#02180f] to-[#01110a] p-8 sm:p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl border border-[#00D084]/25 relative overflow-hidden">
            <div className="relative z-10 space-y-2 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00D084]">
                <Cpu className="size-4" />
                <span>{language === "fr" ? "SUR-MESURE & DÉVELOPPEMENT SPÉCIFIQUE" : "BESPOKE & CUSTOM DEVELOPMENT"}</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {language === "fr" ? "Besoin d'un robot MT5 sur-mesure ?" : "Need a Bespoke MT5 Robot?"}
              </h3>
              <p className="text-xs text-gray-300 font-medium leading-relaxed">
                {language === "fr"
                  ? "Nos ingénieurs quantitatifs développent vos algorithmes personnalisés avec intégration chiffrée."
                  : "Our quantitative engineers develop custom algorithms with encrypted hardware integration."}
              </p>
            </div>

            <Button
              asChild
              className="relative z-10 neon-btn rounded-2xl px-8 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-105 shrink-0 cursor-pointer text-[#021a11]"
            >
              <Link to="/contact" className="flex items-center gap-2">
                <span>{language === "fr" ? "Demander un Robot Sur-Mesure" : "Request Custom EA"}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {/* Risk Disclaimer */}
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 text-xs leading-relaxed text-gray-500 font-medium shadow-xs">
            {RISK_DISCLAIMER}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
