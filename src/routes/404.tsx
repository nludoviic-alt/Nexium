import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, ChevronRight, Compass, Home, LifeBuoy, LineChart, Search, ShieldAlert, Sparkles } from "lucide-react";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export const Route = createFileRoute("/404")({
  head: () => ({
    meta: [
      { title: "Page Introuvable (404) — Nexium Markets" },
      {
        name: "description",
        content: "La page demandée est introuvable ou a été déplacée sur l'infrastructure Nexium Markets.",
      },
    ],
  }),
  component: NotFoundPage,
});

export function NotFoundPage() {
  const { language } = useLanguage();

  const quickLinks = [
    {
      icon: Bot,
      title: language === "fr" ? "Robots & Algorithmes" : "Trading Robots",
      desc: language === "fr" ? "Explorez nos Expert Advisors MT5 certifiés" : "Explore certified MT5 Expert Advisors",
      to: "/robots",
    },
    {
      icon: LineChart,
      title: language === "fr" ? "Performances en Direct" : "Live Performance",
      desc: language === "fr" ? "Statistiques vérifiées et métriques institutionnelles" : "Audited metrics and verified statistics",
      to: "/performance",
    },
    {
      icon: Compass,
      title: language === "fr" ? "Comment ça marche" : "How It Works",
      desc: language === "fr" ? "Architecture FIX API 4.4 et serveurs Equinix NY4" : "FIX API 4.4 and Equinix NY4 infrastructure",
      to: "/how-it-works",
    },
    {
      icon: LifeBuoy,
      title: language === "fr" ? "Support Technique 24/7" : "24/7 Support Desk",
      desc: language === "fr" ? "Assistance directe par nos ingénieurs quantitatifs" : "Direct help from our quantitative engineers",
      to: "/contact",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-white flex flex-col justify-between font-sans selection:bg-[#00D084]/30 selection:text-white">
      <SiteHeader transparent />

      <main className="relative flex-1 flex items-center justify-center px-4 py-28 sm:py-36 overflow-hidden">
        {/* Background Ambient Glow & Dot Matrix */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[500px] bg-[#00D084]/10 blur-[180px] rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-emerald-500/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(#00D084_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-8">
          {/* Eyebrow Status Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-black tracking-widest text-[#00D084] uppercase shadow-[0_0_20px_rgba(0,208,132,0.2)] backdrop-blur-xl">
            <span className="size-2 rounded-full bg-[#00D084] animate-ping" />
            <span>{language === "fr" ? "SIGNAL PERDU // ERREUR 404" : "SIGNAL LOST // ERROR 404"}</span>
          </div>

          {/* Large Stylized 404 Glitch & Neon Display */}
          <div className="relative py-2 select-none">
            <h1 className="text-8xl sm:text-9xl md:text-[140px] font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 drop-shadow-[0_0_35px_rgba(0,208,132,0.35)]">
              404
            </h1>
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <span className="px-4 py-1 rounded-md bg-black/80 border border-[#00D084]/40 text-[#00D084] font-mono text-xs sm:text-sm font-black tracking-widest uppercase shadow-lg">
                PAGE NOT FOUND
              </span>
            </div>
          </div>

          {/* Explanation Text */}
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              {language === "fr" ? "Cette destination est introuvable" : "This destination cannot be found"}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
              {language === "fr"
                ? "L'adresse demandée n'existe pas ou a été déplacée sur nos nœuds de routage. Veuillez vérifier l'URL ou utiliser les raccourcis ci-dessous."
                : "The requested route does not exist or has been relocated across our nodes. Please verify the URL or select a valid destination below."}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              className="rounded-full bg-[#00D084] hover:bg-[#00b070] text-slate-950 px-8 py-3.5 text-sm font-extrabold tracking-wide transition-all shadow-[0_0_25px_rgba(0,208,132,0.4)] hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <Link to="/">
                <Home className="size-4" />
                <span>{language === "fr" ? "Retour à l'Accueil" : "Return to Home"}</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="rounded-full border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white px-7 py-3.5 text-sm font-bold tracking-wide transition-all hover:border-[#00D084]/50 cursor-pointer hover:scale-105"
            >
              <Link to="/robots">
                <span>{language === "fr" ? "Explorer les Robots" : "Explore Robots"}</span>
                <ArrowRight className="size-4 ml-2 text-[#00D084]" />
              </Link>
            </Button>
          </div>

          {/* Helpful Navigation Cards Grid */}
          <div className="pt-8 text-left">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4 font-mono">
              {language === "fr" ? "Raccourcis Recommandés" : "Recommended Destinations"}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto">
              {quickLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="group relative flex items-center gap-4 p-4 rounded-2xl border border-slate-800/80 bg-[#0b1019]/90 hover:bg-[#0f1724] hover:border-[#00D084]/50 transition-all duration-200 shadow-md hover:shadow-[0_0_20px_rgba(0,208,132,0.15)]"
                  >
                    <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[#00D084] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#00D084] group-hover:text-slate-950 transition-all">
                      <IconComponent className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white group-hover:text-[#00D084] transition-colors truncate flex items-center justify-between">
                        <span>{link.title}</span>
                        <ChevronRight className="size-4 text-slate-600 group-hover:text-[#00D084] group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div className="text-xs text-slate-400 font-normal truncate mt-0.5">
                        {link.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
