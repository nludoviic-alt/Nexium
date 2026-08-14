import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Cpu,
  Zap,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Activity,
  Star,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { useLanguage } from "@/context/LanguageContext";

const Mt5SimulatedTradingPhone = lazy(() =>
  import("@/components/site/Mt5SimulatedTradingPhone").then(({ Mt5SimulatedTradingPhone }) => ({
    default: Mt5SimulatedTradingPhone,
  })),
);
const Mt5SimulatedTradingDesktop = lazy(() =>
  import("@/components/site/Mt5SimulatedTradingDesktop").then(({ Mt5SimulatedTradingDesktop }) => ({
    default: Mt5SimulatedTradingDesktop,
  })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexium Markets — Robots IA & Expert Advisors MetaTrader 5" },
      {
        name: "description",
        content:
          "Découvrez nos robots de trading IA certifiés pour MetaTrader 5 : exécution colocalisée Equinix NY4 <38ms, licence Hardware-Bound et gestion automatisée des risques.",
      },
    ],
  }),
  component: HomePage,
});

function TradingHero({
  activeSlide,
  onPrevious,
  onNext,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: {
  activeSlide: number;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const { language, t } = useLanguage();

  const slides = [
    {
      badge: language === "fr" ? "Plateforme d'Automatisation MT5" : "MT5 Automation Platform",
      titlePrefix: language === "fr" ? "Automatisez Votre Trading" : "Automate Your Trading",
      titleHighlight: language === "fr" ? "MetaTrader 5" : "MetaTrader 5",
      description:
        language === "fr"
          ? "Déployez et pilotez vos Expert Advisors MT5 depuis un espace unique, avec une surveillance continue et des garde-fous de risque configurables."
          : "Deploy and control your MT5 Expert Advisors from a single terminal, backed by continuous monitoring and customizable risk safeguards.",
      primaryCta: { label: t.hero.ctaPrimary, to: "/robots" },
      secondaryCta: { label: t.hero.ctaSecondary, to: "/NEXIUM" },
    },
    {
      badge: language === "fr" ? "Moteurs MT5 Certifiés" : "Certified MT5 Engines",
      titlePrefix: language === "fr" ? "Algorithmes Élite." : "Elite Algorithms.",
      titleHighlight: language === "fr" ? "Gardez le Contrôle." : "Stay in Control.",
      description:
        language === "fr"
          ? "Exécution FIX API 4.4 ultra-rapide en 21 ms colocalisée sur Equinix NY4. Vos stratégies tournent 24/7 avec allocation de risque dynamique."
          : "Sub-25ms ultra-low latency FIX execution collocated at Equinix NY4. Strategies run 24/7 with dynamic risk allocation.",
      primaryCta: {
        label: language === "fr" ? "Explorer les Robots" : "Explore Robots",
        to: "/robots",
      },
      secondaryCta: {
        label: language === "fr" ? "Voir les Stratégies" : "View Strategies",
        to: "/robots",
      },
    },
    {
      badge: language === "fr" ? "Supervision en Temps Réel" : "Real-Time Oversight",
      titlePrefix: language === "fr" ? "Pilotez vos Robots" : "Supervise Your Bots",
      titleHighlight: language === "fr" ? "En Temps Réel." : "In Real-Time.",
      description:
        language === "fr"
          ? "Suivez vos positions, votre exposition et vos performances dans un dashboard clair, conçu pour garder la maîtrise absolue de chaque stratégie."
          : "Monitor live positions, equity exposure, and performance in an executive cockpit built for total strategy mastery.",
      primaryCta: {
        label: language === "fr" ? "Voir la performance" : "View Performance",
        to: "/performance",
      },
      secondaryCta: {
        label: language === "fr" ? "Découvrir le Dashboard" : "Explore Dashboard",
        to: "/NEXIUM",
      },
    },
    {
      badge: language === "fr" ? "Gestion du Risque Avancée" : "Advanced Risk Controls",
      titlePrefix: language === "fr" ? "Sécurité Maximale." : "Maximum Safety.",
      titleHighlight: language === "fr" ? "Capital Protégé." : "Capital Protected.",
      description:
        language === "fr"
          ? "Protection intégrée contre les drawdowns excessifs, coupure automatique d'urgence et dimensionnement dynamique des lots pour sécuriser votre capital."
          : "Built-in protection against unexpected drawdowns, automatic emergency cut-offs, and dynamic lot sizing to secure capital.",
      primaryCta: {
        label: language === "fr" ? "Nos Protocoles de Risque" : "Risk Protocols",
        to: "/how-it-works",
      },
      secondaryCta: { label: t.nav.openAccount, to: "/register" },
    },
  ];

  const currentSlide = slides[activeSlide] ?? slides[0];

  const staticHeroFeatures = [
    {
      icon: Cpu,
      title: "MetaTrader 5",
      subtitle: language === "fr" ? "100% Compatible EA" : "100% EA Compatible",
    },
    {
      icon: Zap,
      title: language === "fr" ? "Faible Latence" : "Low Latency",
      subtitle: "Equinix NY4 <21ms",
    },
    {
      icon: ShieldCheck,
      title: "Risk Governor",
      subtitle: language === "fr" ? "Plafond Drawdown" : "Drawdown Ceiling",
    },
    {
      icon: Activity,
      title: language === "fr" ? "Monitoring 24/7" : "24/7 Monitoring",
      subtitle: language === "fr" ? "Surveillance Live" : "Live Stream",
    },
  ];

  return (
    <section
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="hero-section relative min-h-[720px] sm:min-h-[820px] md:min-h-[880px] lg:min-h-[920px] flex flex-col justify-between overflow-hidden bg-[#0b0d10] text-white"
    >
      {/* Background SVG Grid & Ambient Glows */}
      <div
        className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] md:w-[900px] h-[320px] sm:h-[450px] md:h-[550px] bg-[#00D084]/10 blur-[120px] sm:blur-[200px] rounded-full" />
        <svg
          className="absolute inset-0 w-full h-full opacity-35"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
        >
          <defs>
            <pattern
              id="dotPattern"
              x="0"
              y="0"
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.3" fill="#00D084" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotPattern)" />
        </svg>
      </div>

      {/* Side Navigation Arrows */}
      <div className="absolute inset-y-0 left-2 sm:left-4 lg:left-8 hidden md:flex items-center z-30 pointer-events-auto">
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Previous slide"
          className="size-10 sm:size-11 rounded-full border border-white/15 bg-[#0b0d10]/80 text-gray-300 hover:text-[#00D084] hover:border-[#00D084] hover:bg-[#00D084]/10 backdrop-blur-md flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-110"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>

      <div className="absolute inset-y-0 right-2 sm:right-4 lg:right-8 hidden md:flex items-center z-30 pointer-events-auto">
        <button
          type="button"
          onClick={onNext}
          aria-label="Next slide"
          className="size-10 sm:size-11 rounded-full border border-white/15 bg-[#0b0d10]/80 text-gray-300 hover:text-[#00D084] hover:border-[#00D084] hover:bg-[#00D084]/10 backdrop-blur-md flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-110"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Center Hero Content Container */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 pt-28 sm:pt-36 pb-6 sm:pb-8 max-w-5xl mx-auto my-auto select-none w-full">
        <div key={activeSlide} className="animate-hero-fade flex flex-col items-center w-full">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00D084]/35 bg-[#00D084]/10 px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-black tracking-[0.14em] sm:tracking-[0.16em] text-[#00D084] uppercase shadow-[0_0_15px_rgba(0,208,132,0.15)] backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-[#00D084] animate-pulse" />
            <span className="truncate max-w-[260px] sm:max-w-none">{currentSlide.badge}</span>
          </div>

          {/* Main heading - Fluid Responsive Typography */}
          <h1 className="mt-4 sm:mt-5 text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-[1.1] sm:leading-[1.08] break-words">
            <span className="block text-white">
              {currentSlide.titlePrefix}
            </span>
            <span className="block text-[#00D084] drop-shadow-[0_0_25px_rgba(0,208,132,0.4)] mt-1 sm:mt-2">
              {currentSlide.titleHighlight}
            </span>
          </h1>

          {/* Value proposition paragraph */}
          <p className="mt-3 sm:mt-4 text-xs sm:text-base md:text-lg text-gray-200 font-medium max-w-2xl leading-relaxed mx-auto min-h-[42px] sm:min-h-[56px] flex items-center justify-center px-2">
            {currentSlide.description}
          </p>

          {/* Call to Actions */}
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none">
            <Button
              asChild
              className="hero-watch-btn w-full sm:w-auto rounded-full px-7 sm:px-8 py-3.5 text-xs sm:text-base font-black text-white tracking-wide cursor-pointer hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,208,132,0.3)] justify-center"
            >
              <Link to={currentSlide.primaryCta.to} className="flex items-center justify-center gap-2">
                <span>{currentSlide.primaryCta.label}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto rounded-full border-white/20 bg-black/40 px-6 sm:px-7 py-3.5 text-xs sm:text-base font-bold text-white hover:bg-white/10 hover:border-[#00D084]/50 backdrop-blur-md cursor-pointer hover:scale-105 transition-all justify-center"
            >
              <Link to={currentSlide.secondaryCta.to}>{currentSlide.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelect(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeSlide
                    ? "w-8 sm:w-9 bg-[#00D084] shadow-[0_0_10px_#00D084]"
                    : "w-2.5 sm:w-3 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM 4 STATIC FEATURE ITEMS */}
      <div className="relative z-20 w-full border-t border-white/10 bg-[#0b0d10]/85 backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] px-3 sm:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {staticHeroFeatures.map((feat, i) => {
              const IconComponent = feat.icon;
              return (
                <div
                  key={i}
                  className="group flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3.5 py-3.5 sm:py-5 px-2.5 sm:px-6 transition-all duration-300 hover:bg-[#00D084]/5 cursor-default"
                >
                  <div className="size-8 sm:size-10 rounded-xl bg-[#00D084]/10 border border-[#00D084]/25 text-[#00D084] flex items-center justify-center shrink-0 group-hover:bg-[#00D084] group-hover:text-black group-hover:border-[#00D084] group-hover:shadow-[0_0_18px_rgba(0,208,132,0.35)] transition-all duration-300">
                    <IconComponent className="size-4 sm:size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-base font-black text-white group-hover:text-[#00D084] transition-colors truncate">
                      {feat.title}
                    </div>
                    <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.14em] text-gray-400 group-hover:text-gray-200 transition-colors truncate mt-0.5">
                      {feat.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setActiveSlide((prev) => (prev + 1) % 4);
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % 4);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + 4) % 4);

  return (
    <PageShell transparentHeader>
      <div className="relative w-full overflow-hidden bg-[#0b0d10] text-white">
        {/* 1. HERO SLIDER */}
        <TradingHero
          activeSlide={activeSlide}
          onPrevious={prevSlide}
          onNext={nextSlide}
          onSelect={setActiveSlide}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        />

        {/* 2. SECTION: COMMODITIES SIMULATOR SHOWCASE (CLEAN PURE WHITE THEME) */}
        <ScrollReveal className="bg-white">
          <section className="relative w-full bg-white py-24 sm:py-28 text-gray-900 border-b border-gray-200">
            <Suspense
              fallback={
                <div className="mx-auto min-h-[560px] max-w-7xl animate-pulse rounded-3xl bg-gray-100" />
              }
            >
              <Mt5SimulatedTradingPhone
                assetType="commodities"
                title={language === "fr" ? "Matières Premières" : "Commodities"}
                badge={
                  language === "fr" ? "ROBOTS MT5 · MATIÈRES PREMIÈRES" : "MT5 ROBOTS · COMMODITIES"
                }
                description={
                  language === "fr"
                    ? "Automatisez vos stratégies sur l'or, l'argent, le pétrole et les matières premières. Vos robots exécutent, vous suivez chaque position en temps réel depuis votre dashboard."
                    : "Automate your strategies on Gold, Silver, Oil, and commodities. Your algorithms execute while you monitor every position in real-time from your dashboard."
                }
                isDarkTheme={false}
                pills={[
                  {
                    symbol: "GOLD",
                    name: "GOLD",
                    bgColor: "#f5a623",
                    textColor: "#000000",
                    iconBg: "rgba(255,255,255,0.4)",
                  },
                  {
                    symbol: "SILVER",
                    name: "SILVER",
                    bgColor: "#9b9b9b",
                    textColor: "#ffffff",
                    iconBg: "rgba(255,255,255,0.25)",
                  },
                ]}
              />
            </Suspense>
          </section>
        </ScrollReveal>

        {/* 3. SECTION: STOCKS & INDICES SIMULATOR SHOWCASE (ELEGANT OBSIDIAN CHARCOAL #0b0d10) */}
        <ScrollReveal className="bg-[#0b0d10]">
          <section className="relative w-full bg-[#0b0d10] py-24 sm:py-28 border-b border-gray-800/80">
            <Suspense
              fallback={
                <div className="mx-auto min-h-[560px] max-w-7xl animate-pulse rounded-3xl bg-white/5" />
              }
            >
              <Mt5SimulatedTradingDesktop
                title={language === "fr" ? "Actions & Indices" : "Stocks & Indices"}
                description={
                  language === "fr"
                    ? "Exécutez vos algorithmes MT5 sur les plus grandes actions et indices mondiaux, avec un suivi en temps réel de vos positions et de votre performance."
                    : "Execute your MT5 algorithms on the world's leading stocks and indices, backed by real-time telemetry and execution analytics."
                }
                pills={[
                  {
                    symbol: "NVDA",
                    name: "NVDA",
                    bgColor: "#c5f946",
                    textColor: "#000000",
                    iconBg: "#76b900",
                  },
                  {
                    symbol: "AMZN",
                    name: "AMZN",
                    bgColor: "#ffc107",
                    textColor: "#000000",
                    iconBg: "#ff9900",
                  },
                ]}
              />
            </Suspense>
          </section>
        </ScrollReveal>

        {/* 5. SECTION 4: RAW SPREAD PRICING & LIQUIDITY (PURE WHITE THEME) */}
        <ScrollReveal className="bg-white">
          <section className="w-full bg-white py-16 sm:py-24 md:py-28 text-gray-900 border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex flex-col gap-8 sm:gap-12">
              {/* Top Large Feature Hero Card */}
              <div className="premium-light-card p-6 xs:p-8 sm:p-12 md:p-16 rounded-2xl sm:rounded-3xl">
                <div className="grid grid-cols-1 items-center gap-8 lg:gap-12 lg:grid-cols-2">
                  <div className="flex flex-col items-start text-left">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#00D084]/15 border border-[#00D084]/30 px-3.5 py-1 text-xs font-black tracking-widest text-[#059669] uppercase">
                      {language === "fr" ? "LIQUIDITÉ INSTITUTIONNELLE" : "INSTITUTIONAL LIQUIDITY"}
                    </span>
                    <h2 className="mt-4 text-2xl sm:text-4xl md:text-5xl font-black text-black leading-tight">
                      {language === "fr"
                        ? "Spreads Bruts Dès 0.0 Pips"
                        : "Raw Spreads From 0.0 Pips"}
                    </h2>
                    <p className="mt-4 text-sm sm:text-base font-medium text-gray-700 leading-relaxed">
                      {language === "fr"
                        ? "Connectez vos algorithmes de trading à notre pool de liquidité directe pour des conditions de trading professionnelles et sans compromis."
                        : "Connect your trading algorithms to our direct liquidity pool for uncompromised institutional-grade execution."}
                    </p>
                    <ul className="mt-6 sm:mt-8 space-y-3.5 sm:space-y-4 text-sm sm:text-base font-semibold text-gray-800">
                      <li className="flex items-start sm:items-center gap-3">
                        <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-[#00D084] text-[#021a11] font-extrabold text-xs shadow-sm mt-0.5 sm:mt-0">
                          ✓
                        </span>
                        <span>
                          {language === "fr"
                            ? "Spreads bruts réels sans majoration artificielle"
                            : "Direct raw spreads without artificial markups"}
                        </span>
                      </li>
                      <li className="flex items-start sm:items-center gap-3">
                        <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-[#00D084] text-[#021a11] font-extrabold text-xs shadow-sm mt-0.5 sm:mt-0">
                          ✓
                        </span>
                        <span>
                          {language === "fr"
                            ? "Liquidité institutionnelle dédiée aux robots de trading haute fréquence"
                            : "Deep liquidity stream dedicated to high-frequency MT5 Expert Advisors"}
                        </span>
                      </li>
                    </ul>
                    <div className="mt-8 sm:mt-10 w-full sm:w-auto">
                      <Button
                        asChild
                        className="w-full sm:w-auto rounded-full bg-gray-900 px-8 py-3.5 text-xs font-extrabold text-white hover:bg-black uppercase tracking-wider shadow-md justify-center"
                      >
                        <Link to="/pricing">
                          {language === "fr" ? "Aperçu de la Tarification" : "Pricing Overview"}
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Graphic Mockup */}
                  <div className="relative flex justify-center lg:justify-end w-full">
                    <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-gray-200 group">
                      <img
                        src="/mobile-app-mockup.jpg"
                        alt="Mobile App"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 rounded-xl sm:rounded-2xl bg-white/95 p-3 sm:p-4 shadow-2xl border border-gray-100 backdrop-blur-md flex flex-col text-xs font-bold">
                        <div className="flex items-center justify-between gap-3 sm:gap-4 text-black">
                          <span className="font-extrabold text-xs sm:text-sm">EURUSD</span>
                          <span className="text-[#059669] font-extrabold">+0.15% ▲</span>
                        </div>
                        <div className="mt-1.5 sm:mt-2 flex gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                          <span>Bid: 1.12009</span>
                          <span>Ask: 1.12009</span>
                          <span className="font-extrabold text-black">Spread: 0.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom 2 Split Cards */}
              <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
                {/* Card 1: Fast Order Execution */}
                <div className="premium-light-card flex flex-col justify-between p-6 xs:p-8 sm:p-12 rounded-2xl sm:rounded-3xl">
                  <div>
                    <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-black">
                      {language === "fr" ? "Exécution Ultra-Rapide" : "Ultra-Fast Execution"}
                    </h3>
                    <ul className="mt-6 sm:mt-8 space-y-3.5 sm:space-y-4 text-sm sm:text-base font-semibold text-gray-800">
                      <li className="flex items-start sm:items-center gap-3">
                        <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-[#00D084] text-[#021a11] font-extrabold text-xs shadow-sm mt-0.5 sm:mt-0">
                          ✓
                        </span>
                        <span>
                          {language === "fr"
                            ? "Vitesse d'exécution moyenne sous 38ms***"
                            : "Average sub-38ms execution speed***"}
                        </span>
                      </li>
                      <li className="flex items-start sm:items-center gap-3">
                        <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-[#00D084] text-[#021a11] font-extrabold text-xs shadow-sm mt-0.5 sm:mt-0">
                          ✓
                        </span>
                        <span>
                          {language === "fr"
                            ? "Serveurs colocalisés par fibre optique chez Equinix NY4"
                            : "Fiber cross-connected servers collocated at Equinix NY4"}
                        </span>
                      </li>
                      <li className="flex items-start sm:items-center gap-3">
                        <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-[#00D084] text-[#021a11] font-extrabold text-xs shadow-sm mt-0.5 sm:mt-0">
                          ✓
                        </span>
                        <span>
                          {language === "fr"
                            ? "Serveur VPS ultra-faible latence offert"
                            : "Complimentary ultra-low latency VPS server"}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-8 sm:mt-10">
                    <Button
                      asChild
                      className="w-full sm:w-auto rounded-full bg-gray-200 px-7 py-3 text-xs font-extrabold text-gray-900 hover:bg-gray-300 uppercase tracking-wider justify-center"
                    >
                      <Link to="/how-it-works">
                        {language === "fr" ? "Obtenir Votre VPS Offert" : "Get Included VPS"}
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Card 2: Institutional Grade Trading */}
                <div className="premium-light-card flex flex-col justify-between p-6 xs:p-8 sm:p-12 rounded-2xl sm:rounded-3xl">
                  <div>
                    <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-black">
                      {language === "fr"
                        ? "Infrastructures pour Robots MT5"
                        : "MT5 EA Infrastructure"}
                    </h3>
                    <ul className="mt-6 sm:mt-8 space-y-3.5 sm:space-y-4 text-sm sm:text-base font-semibold text-gray-800">
                      <li className="flex items-start sm:items-center gap-3">
                        <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-[#00D084] text-[#021a11] font-extrabold text-xs shadow-sm mt-0.5 sm:mt-0">
                          ✓
                        </span>
                        <span>
                          {language === "fr"
                            ? "Liquidité réelle et profonde pour vos Expert Advisors"
                            : "Genuine deep market liquidity for automated trading"}
                        </span>
                      </li>
                      <li className="flex items-start sm:items-center gap-3">
                        <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-[#00D084] text-[#021a11] font-extrabold text-xs shadow-sm mt-0.5 sm:mt-0">
                          ✓
                        </span>
                        <span>
                          {language === "fr"
                            ? "Slippage réduit et zéro requote"
                            : "Minimized slippage with zero requotes"}
                        </span>
                      </li>
                      <li className="flex items-start sm:items-center gap-3">
                        <span className="flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-[#00D084] text-[#021a11] font-extrabold text-xs shadow-sm mt-0.5 sm:mt-0">
                          ✓
                        </span>
                        <span>
                          {language === "fr"
                            ? "Des milliards de dollars de volume exécutés chaque jour"
                            : "Billions in volume executed daily across terminals"}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-8 sm:mt-10">
                    <Button
                      asChild
                      className="w-full sm:w-auto rounded-full bg-gray-200 px-7 py-3 text-xs font-extrabold text-gray-900 hover:bg-gray-300 uppercase tracking-wider justify-center"
                    >
                      <Link to="/pricing">
                        {language === "fr" ? "Avantages Tarifs Raw" : "Raw Spread Benefits"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* 6. SECTION 5: EQUINIX DATA CENTERS & ULTRA-LOW LATENCY (OBSIDIAN CHARCOAL #0b0d10) */}
        <ScrollReveal className="bg-[#0b0d10]">
          <section className="relative w-full bg-[#0b0d10] py-16 sm:py-24 md:py-28 text-white border-t border-gray-800/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col gap-10 sm:gap-14">
              <div className="text-center max-w-3xl mx-auto">
                <span className="text-xs font-extrabold text-[#00D084] uppercase tracking-widest bg-[#00D084]/10 px-4 py-1.5 rounded-full border border-[#00D084]/30">
                  {language === "fr"
                    ? "INFRASTRUCTURE TRÈS BASSE LATENCE"
                    : "ULTRA-LOW LATENCY INFRASTRUCTURE"}
                </span>
                <h2 className="mt-4 sm:mt-5 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  {language === "fr"
                    ? "Centres de Données Colocalisés Equinix"
                    : "Equinix Collocated Data Centers"}
                </h2>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-300 font-medium leading-relaxed">
                  {language === "fr"
                    ? "Connectez vos robots MT5 directement aux serveurs financiers de premier rang, pour une exécution fidèle à votre stratégie."
                    : "Connect your MT5 Expert Advisors directly to tier-1 financial hubs for sub-millisecond precision."}
                </p>
              </div>

              {/* Server Nodes Grid */}
              <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
                {/* Node 1: New York NY4 */}
                <div className="glass-card-dark flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-800 hover:border-[#00D084]/60 transition-all group">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                        {language === "fr" ? "MOTEUR PRINCIPAL NY4" : "PRIMARY ENGINE NY4"}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-[#00D084]/20 px-3 py-1 text-[11px] font-extrabold text-[#00D084]">
                        <span className="size-2 rounded-full bg-[#00D084] animate-pulse" /> &lt; 1ms
                      </span>
                    </div>
                    <h3 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-black text-white group-hover:text-[#00D084] transition-colors">
                      Equinix NY4
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm font-bold text-gray-400">New York, USA</p>
                    <p className="mt-3 sm:mt-4 text-xs text-gray-300 leading-relaxed font-medium">
                      {language === "fr"
                        ? "Connexion directe par fibre optique avec les 25 plus grands fournisseurs de liquidité pour un routage instantané."
                        : "Direct optical fiber cross-connect with 25+ top-tier liquidity providers for instant trade routing."}
                    </p>
                  </div>
                  <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400 font-semibold">
                    <span>{language === "fr" ? "Latence vers FIX API" : "Latency to FIX API"}</span>
                    <span className="text-white font-extrabold">0.45 ms</span>
                  </div>
                </div>

                {/* Node 2: London LD4 */}
                <div className="glass-card-dark flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-800 hover:border-[#00D084]/60 transition-all group">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                        {language === "fr" ? "HUB EUROPÉEN LD4" : "EUROPEAN HUB LD4"}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-[#00D084]/20 px-3 py-1 text-[11px] font-extrabold text-[#00D084]">
                        <span className="size-2 rounded-full bg-[#00D084] animate-pulse" /> &lt; 1ms
                      </span>
                    </div>
                    <h3 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-black text-white group-hover:text-[#00D084] transition-colors">
                      Equinix LD4
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm font-bold text-gray-400">London, United Kingdom</p>
                    <p className="mt-3 sm:mt-4 text-xs text-gray-300 leading-relaxed font-medium">
                      {language === "fr"
                        ? "Routage optimisé pour les robots scalpeurs durant la session européenne sur le Forex et les indices."
                        : "Optimized routing for scalping robots during the European session across Forex and Indices."}
                    </p>
                  </div>
                  <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400 font-semibold">
                    <span>{language === "fr" ? "Latence vers FIX API" : "Latency to FIX API"}</span>
                    <span className="text-white font-extrabold">0.68 ms</span>
                  </div>
                </div>

                {/* Node 3: Tokyo TY3 */}
                <div className="glass-card-dark flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-800 hover:border-[#00D084]/60 transition-all group">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                        {language === "fr" ? "HUB ASIE-PACIFIQUE TY3" : "APAC HUB TY3"}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-[#00D084]/20 px-3 py-1 text-[11px] font-extrabold text-[#00D084]">
                        <span className="size-2 rounded-full bg-[#00D084] animate-pulse" /> &lt; 2ms
                      </span>
                    </div>
                    <h3 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-black text-white group-hover:text-[#00D084] transition-colors">
                      Equinix TY3
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm font-bold text-gray-400">Tokyo, Japan</p>
                    <p className="mt-3 sm:mt-4 text-xs text-gray-300 leading-relaxed font-medium">
                      {language === "fr"
                        ? "Connectivité ultra-faible latence pour la session asiatique et les paires en Yen avec redondance 24/5."
                        : "Ultra-low latency connectivity for the Asian trading session and Yen crosses with 24/5 redundancy."}
                    </p>
                  </div>
                  <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400 font-semibold">
                    <span>{language === "fr" ? "Latence vers FIX API" : "Latency to FIX API"}</span>
                    <span className="text-white font-extrabold">1.12 ms</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* 7. SECTION 6: PROPRIETARY ALGO TECH ECOSYSTEM (CLEAN LIGHT THEME) */}
        <ScrollReveal className="bg-[#f4f6f9]">
          <section className="w-full bg-[#f4f6f9] py-16 sm:py-24 md:py-28 text-gray-900 border-t border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col gap-10 sm:gap-14">
              <div className="text-center max-w-3xl mx-auto">
                <span className="text-xs font-extrabold text-[#059669] uppercase tracking-widest bg-[#00D084]/15 px-4 py-1.5 rounded-full border border-[#00D084]/30">
                  {language === "fr"
                    ? "ÉCOSYSTÈME TECHNOLOGIQUE PROPRIÉTAIRE"
                    : "PROPRIETARY TECH ECOSYSTEM"}
                </span>
                <h2 className="mt-4 sm:mt-5 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-black leading-tight">
                  {language === "fr"
                    ? "Conçu pour le Trading Algorithmique MT5"
                    : "Engineered for MT5 Algorithmic Trading"}
                </h2>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
                <div className="premium-light-card flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl">
                  <div>
                    {/* Functional Status Header Bar */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#00D084]/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#059669]">
                        {language === "fr" ? "ROUTAGE DYNAMIQUE" : "DYNAMIC ROUTING"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-500 font-mono">
                        <span className="size-2 rounded-full bg-[#059669] animate-pulse" />
                        TOP OF BOOK
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-black">Smart Order Routing</h3>
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium leading-relaxed text-gray-700">
                      {language === "fr"
                        ? "Notre moteur de routage dynamique analyse simultanément plusieurs pools de liquidité pour exécuter les ordres de vos robots au meilleur prix en temps réel."
                        : "Dynamic routing engine continuously scans multi-tier liquidity pools to fill your Expert Advisor orders at top-of-book prices."}
                    </p>
                  </div>
                  <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-200 text-xs font-bold text-gray-900 flex items-center justify-between">
                    <span>
                      {language === "fr" ? "Protection Anti-Slippage" : "Anti-Slippage Guard"}
                    </span>
                    <span className="text-[#059669] font-extrabold">
                      {language === "fr" ? "Active" : "Active"}
                    </span>
                  </div>
                </div>

                <div className="premium-light-card flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl">
                  <div>
                    {/* Functional Status Header Bar */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#00D084]/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#059669]">
                        {language === "fr" ? "SÉCURITÉ DU CAPITAL" : "CAPITAL SHIELD"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-500 font-mono">
                        <span className="size-2 rounded-full bg-[#059669] animate-pulse" />
                        AUTO CUT-OFF
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-black">Risk Governor &amp; Stop-Out</h3>
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium leading-relaxed text-gray-700">
                      {language === "fr"
                        ? "Définissez des seuils de drawdown automatique, une exposition quotidienne maximale et des plafonds de lots pour protéger vos comptes MT5."
                        : "Set hard drawdown cut-offs, max daily risk exposure, and lot-size ceilings to protect your capital."}
                    </p>
                  </div>
                  <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-200 text-xs font-bold text-gray-900 flex items-center justify-between">
                    <span>
                      {language === "fr" ? "Plafond Pertes Journalières" : "Daily Loss Ceiling"}
                    </span>
                    <span className="text-[#059669] font-extrabold">
                      {language === "fr" ? "Configurable" : "Configurable"}
                    </span>
                  </div>
                </div>

                <div className="premium-light-card flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl">
                  <div>
                    {/* Functional Status Header Bar */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#00D084]/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#059669]">
                        {language === "fr" ? "MÉTRIQUES DE FLUX" : "TELEMETRY FEED"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-gray-500 font-mono">
                        <span className="size-2 rounded-full bg-[#059669] animate-pulse" />
                        TICK PRECISION
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-black">
                      {language === "fr" ? "Télémesure en Temps Réel" : "Real-Time Telemetry"}
                    </h3>
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium leading-relaxed text-gray-700">
                      {language === "fr"
                        ? "Suivez le Win Rate, le Profit Factor et la répartition de vos trades avec nos outils visuels d'analyse de performance."
                        : "Track live Win Rates, Profit Factors, and execution breakdown with advanced visual analytics."}
                    </p>
                  </div>
                  <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-200 text-xs font-bold text-gray-900 flex items-center justify-between">
                    <span>{language === "fr" ? "Précision Données" : "Data Precision"}</span>
                    <span className="text-[#059669] font-extrabold">
                      {language === "fr" ? "Niveau Tick" : "Tick Level"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* 8. SECTION 7: 4-STEP AUTOMATION PROTOCOL (OBSIDIAN CHARCOAL #0b0d10) */}
        <ScrollReveal className="bg-[#0b0d10]">
          <section className="relative w-full bg-[#0b0d10] py-16 sm:py-24 md:py-28 text-white border-t border-gray-800/80">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col gap-10 sm:gap-14">
              <div className="text-center max-w-3xl mx-auto">
                <span className="text-xs font-extrabold text-[#00D084] uppercase tracking-widest bg-[#00D084]/10 px-4 py-1.5 rounded-full border border-[#00D084]/30">
                  {language === "fr" ? "DÉPLOIEMENT RAPIDE" : "FAST ONBOARDING"}
                </span>
                <h2 className="mt-4 sm:mt-5 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  {language === "fr"
                    ? "Déployez Votre IA MT5 en 4 Étapes Simples"
                    : "Deploy Your MT5 Robot in 4 Simple Steps"}
                </h2>
              </div>

              {/* 4 Steps Grid */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass-card-dark flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-800 relative group hover:border-[#00D084]/50 transition-all">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-[#00D084]">01</span>
                    <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-black text-white group-hover:text-[#00D084] transition-colors">
                      {language === "fr" ? "Création Espace Client" : "Create Client Account"}
                    </h3>
                    <p className="mt-2.5 sm:mt-3 text-xs font-medium text-gray-300 leading-relaxed">
                      {language === "fr"
                        ? "Inscrivez votre profil en moins de 2 minutes et accédez immédiatement à votre portail sécurisé."
                        : "Sign up in under 2 minutes and gain instant access to your secure cockpit."}
                    </p>
                  </div>
                </div>

                <div className="glass-card-dark flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-800 relative group hover:border-[#00D084]/50 transition-all">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-[#00D084]">02</span>
                    <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-black text-white group-hover:text-[#00D084] transition-colors">
                      {language === "fr" ? "Connexion Terminal MT5" : "Connect MT5 Terminal"}
                    </h3>
                    <p className="mt-2.5 sm:mt-3 text-xs font-medium text-gray-300 leading-relaxed">
                      {language === "fr"
                        ? "Associez votre terminal MetaTrader 5 à votre compte d'exécution Raw Spread ultra-faible latence."
                        : "Link your MetaTrader 5 terminal to our low-latency Raw Spread execution bridges."}
                    </p>
                  </div>
                </div>

                <div className="glass-card-dark flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-800 relative group hover:border-[#00D084]/50 transition-all">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-[#00D084]">03</span>
                    <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-black text-white group-hover:text-[#00D084] transition-colors">
                      {language === "fr" ? "Activation Robot IA" : "Activate Expert Advisor"}
                    </h3>
                    <p className="mt-2.5 sm:mt-3 text-xs font-medium text-gray-300 leading-relaxed">
                      {language === "fr"
                        ? "Activez vos licences d'Expert Advisors certifiés (Nexium AI Gold, Trend Core, Index Reversion)."
                        : "Activate certified Expert Advisor licenses with one-click hardware bonding."}
                    </p>
                  </div>
                </div>

                <div className="glass-card-dark flex flex-col justify-between p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-800 relative group hover:border-[#00D084]/50 transition-all">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-[#00D084]">04</span>
                    <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-black text-white group-hover:text-[#00D084] transition-colors">
                      {language === "fr" ? "Suivi Télémétrique" : "Live Telemetry & Control"}
                    </h3>
                    <p className="mt-2.5 sm:mt-3 text-xs font-medium text-gray-300 leading-relaxed">
                      {language === "fr"
                        ? "Supervisez vos positions en direct, vos limites de risque et vos métriques de télémesure 24/7."
                        : "Supervise live positions, risk limits, and telemetry streaming 24/7."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  asChild
                  className="neon-btn w-full sm:w-auto rounded-full px-8 sm:px-12 py-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#021a11] justify-center"
                >
                  <Link to="/robots">
                    {language === "fr"
                      ? "Accéder au Catalogue Robots IA"
                      : "Access MT5 Robot Catalog"}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* HARMONIZED FULL-WIDTH WHITE BANNER BEFORE FOOTER */}
        <div className="w-full bg-white border-t border-gray-200 py-10 sm:py-16 px-4 sm:px-6 md:px-8 text-gray-900">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column (7 Cols): Headline & Subtitle Card */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#00D084]/15 border border-[#00D084]/35 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#059669] shadow-sm">
                  <span className="size-2 rounded-full bg-[#059669] animate-pulse" />
                  {language === "fr" ? "EXPERT ADVISORS MT5" : "MT5 EXPERT ADVISORS"}
                </span>

                <h3 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 leading-[1.1]">
                  {language === "fr" ? (
                    <>
                      Automatisez votre trading.
                      <br className="hidden sm:inline" />{" "}
                      <span className="text-[#059669]">Gardez le contrôle.</span>
                    </>
                  ) : (
                    <>
                      Automate your trading.
                      <br className="hidden sm:inline" />{" "}
                      <span className="text-[#059669]">Stay in control.</span>
                    </>
                  )}
                </h3>

                {/* Elegant Light Description Card */}
                <div className="mt-4 sm:mt-5 rounded-2xl border border-gray-200/90 bg-gray-50/90 p-3.5 sm:p-4.5 text-xs sm:text-base text-gray-700 font-medium leading-relaxed shadow-sm flex items-start sm:items-center gap-3 sm:gap-3.5 w-full max-w-2xl">
                  <div className="size-7 sm:size-8 rounded-full bg-[#00D084]/15 border border-[#00D084]/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <span className="size-2 sm:size-2.5 rounded-full bg-[#059669] animate-pulse" />
                  </div>
                  <p className="m-0 font-medium text-gray-700">
                    {language === "fr"
                      ? "Connectez votre compte MT5, activez vos robots certifiés et supervisez vos positions en direct depuis votre dashboard."
                      : "Connect your MT5 account, activate certified robots, and supervise execution from your dashboard."}
                  </p>
                </div>
              </div>

              {/* Right Column (5 Cols): Stacked Dual CTA Buttons with Latency Badge */}
              <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center gap-3 w-full">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1">
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    {language === "fr"
                      ? "Colocalisation Equinix NY4 < 38ms"
                      : "Collocated Equinix NY4 < 38ms"}
                  </span>
                </div>

                <Button
                  asChild
                  className="w-full sm:w-72 rounded-full bg-[#0d141e] hover:bg-black px-8 py-4 text-xs font-black uppercase tracking-wider text-white shadow-xl hover:scale-105 transition-all cursor-pointer justify-center"
                >
                  <Link to="/robots" className="flex items-center justify-center gap-2">
                    <span>
                      {language === "fr" ? "EXPLORER LES ROBOTS MT5" : "EXPLORE MT5 ROBOTS"}
                    </span>
                    <ArrowRight className="size-4 text-[#00D084]" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-72 rounded-full border-gray-300 bg-white hover:bg-gray-100 px-8 py-4 text-xs font-black uppercase tracking-wider text-gray-900 shadow-sm hover:scale-105 transition-all cursor-pointer justify-center"
                >
                  <Link to="/how-it-works" className="flex items-center justify-center">
                    {language === "fr" ? "GUIDE D'ACTIVATION" : "ACTIVATION GUIDE"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
