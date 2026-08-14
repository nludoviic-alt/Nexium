import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  ChevronDown,
  Bot,
  Zap,
  Activity,
  FileText,
  Lock,
  Headphones,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export function SiteFooter() {
  const { language, t } = useLanguage();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <footer className="w-full bg-[#05080e] text-gray-300 border-t border-[#00D084]/20">
      {/* ========================================================================= */}
      {/* 1. MOBILE FOOTER DESIGN (VISIBLE ONLY ON MOBILE & TABLET: lg:hidden)      */}
      {/* ========================================================================= */}
      <div className="lg:hidden px-4 sm:px-6 pt-10 pb-8 space-y-8">
        {/* Mobile Brand Identity & Live Status */}
        <div className="flex flex-col items-start gap-4">
          <Link to="/" className="flex flex-col justify-center leading-none group py-1">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl xs:text-3xl font-black text-white tracking-[0.22em] uppercase font-mono drop-shadow-[0_2px_15px_rgba(255,255,255,0.15)] group-hover:text-[#00D084] transition-colors">
                NEXIUM
              </span>
              <span className="h-4 w-px bg-gradient-to-b from-[#00D084] to-transparent opacity-80" />
              <span className="text-xs xs:text-sm font-extrabold text-[#00D084] tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(0,208,132,0.3)]">
                MARKETS
              </span>
            </div>
            <span className="mt-1 text-[9px] font-extrabold text-gray-400 tracking-[0.35em] uppercase font-sans">
              {t.nav.brandSub}
            </span>
          </Link>

          <p className="text-xs text-gray-300 leading-relaxed font-medium">
            {t.footer.tagline}
          </p>

          {/* Mobile Certified Badge & Live Node */}
          <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0c111a] p-2.5 shadow-sm">
              <div className="size-6 rounded-lg bg-[#00D084]/15 border border-[#00D084]/30 flex items-center justify-center shrink-0">
                <Bot className="size-3.5 text-[#00D084]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-white uppercase block truncate">Expert Advisors</span>
                <span className="text-[9px] font-mono text-[#00D084] font-bold">MetaTrader 5</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0c111a] p-2.5 shadow-sm">
              <div className="size-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Zap className="size-3.5 text-sky-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-white uppercase block truncate">Equinix NY4</span>
                <span className="text-[9px] font-mono text-sky-400 font-bold">&lt; 21ms FIX API</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Quick Action Pill Hub */}
        <div className="space-y-2 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">ACCÈS RAPIDE</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/NEXIUM"
              className="flex items-center justify-between p-3 rounded-xl border border-[#00D084]/30 bg-[#00D084]/10 hover:bg-[#00D084]/15 transition-all text-xs font-bold text-white group"
            >
              <span className="flex items-center gap-2">
                <Activity className="size-4 text-[#00D084]" />
                <span>Dashboard</span>
              </span>
              <ArrowUpRight className="size-3.5 text-[#00D084] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>

            <Link
              to="/robots"
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.08] bg-[#0f1520] hover:bg-[#141c2b] transition-all text-xs font-bold text-white group"
            >
              <span className="flex items-center gap-2">
                <Bot className="size-4 text-gray-400 group-hover:text-white" />
                <span>Robots MT5</span>
              </span>
              <ArrowUpRight className="size-3.5 text-gray-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to="/performance"
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.08] bg-[#0f1520] hover:bg-[#141c2b] transition-all text-xs font-bold text-white group"
            >
              <span className="flex items-center gap-2">
                <Zap className="size-4 text-gray-400 group-hover:text-white" />
                <span>Performance</span>
              </span>
              <ArrowUpRight className="size-3.5 text-gray-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              to="/contact"
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.08] bg-[#0f1520] hover:bg-[#141c2b] transition-all text-xs font-bold text-white group"
            >
              <span className="flex items-center gap-2">
                <Headphones className="size-4 text-gray-400 group-hover:text-white" />
                <span>Support 24/7</span>
              </span>
              <ArrowUpRight className="size-3.5 text-gray-400 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>

        {/* Mobile Interactive Accordions */}
        <div className="space-y-2 border-t border-white/[0.08] pt-4">
          {/* Accordion 1: Plateforme */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0a0f18] overflow-hidden">
            <button
              onClick={() => toggleSection("platform")}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-black uppercase tracking-wider text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Bot className="size-4 text-[#00D084]" />
                {t.footer.colPlatform}
              </span>
              <ChevronDown
                className={`size-4 text-gray-400 transition-transform duration-200 ${
                  openSection === "platform" ? "rotate-180 text-[#00D084]" : ""
                }`}
              />
            </button>
            {openSection === "platform" && (
              <div className="px-4 pb-3.5 pt-1 space-y-2.5 text-xs font-medium border-t border-white/[0.04]">
                <Link to="/robots" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.nav.robots}
                </Link>
                <Link to="/how-it-works" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.nav.howItWorks}
                </Link>
                <Link to="/performance" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.nav.performance}
                </Link>
                <Link to="/pricing" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {language === "fr" ? "Tarifs & Licences" : "Pricing & Licenses"}
                </Link>
                <Link to="/login" className="block text-[#00D084] font-bold py-1">
                  {t.nav.clientArea}
                </Link>
              </div>
            )}
          </div>

          {/* Accordion 2: Ressources */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0a0f18] overflow-hidden">
            <button
              onClick={() => toggleSection("resources")}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-black uppercase tracking-wider text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileText className="size-4 text-sky-400" />
                {language === "fr" ? "Ressources & Guides" : "Resources"}
              </span>
              <ChevronDown
                className={`size-4 text-gray-400 transition-transform duration-200 ${
                  openSection === "resources" ? "rotate-180 text-sky-400" : ""
                }`}
              />
            </button>
            {openSection === "resources" && (
              <div className="px-4 pb-3.5 pt-1 space-y-2.5 text-xs font-medium border-t border-white/[0.04]">
                <Link to="/about" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {language === "fr" ? "Sécurité & Infrastructure" : "Security & Infrastructure"}
                </Link>
                <Link to="/faq" className="block text-gray-300 hover:text-[#00D084] py-1">
                  FAQ
                </Link>
                <Link to="/blog" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {language === "fr" ? "Blog & Actualités" : "Blog & Market Insights"}
                </Link>
                <Link to="/about" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {language === "fr" ? "À propos" : "About Us"}
                </Link>
                <Link to="/contact" className="block text-gray-300 hover:text-[#00D084] py-1">
                  Contact
                </Link>
              </div>
            )}
          </div>

          {/* Accordion 3: Légal & Conformité */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0a0f18] overflow-hidden">
            <button
              onClick={() => toggleSection("legal")}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-black uppercase tracking-wider text-white hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Lock className="size-4 text-amber-400" />
                {t.footer.colLegal}
              </span>
              <ChevronDown
                className={`size-4 text-gray-400 transition-transform duration-200 ${
                  openSection === "legal" ? "rotate-180 text-amber-400" : ""
                }`}
              />
            </button>
            {openSection === "legal" && (
              <div className="px-4 pb-3.5 pt-1 space-y-2.5 text-xs font-medium border-t border-white/[0.04]">
                <Link to="/login" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.nav.login}
                </Link>
                <Link to="/register" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.nav.openAccount}
                </Link>
                <Link to="/terms" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.footer.terms}
                </Link>
                <Link to="/privacy" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.footer.privacy}
                </Link>
                <Link to="/cookies" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.footer.cookies}
                </Link>
                <Link to="/legal" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.footer.legal}
                </Link>
                <Link to="/risk-disclosure" className="block text-gray-300 hover:text-[#00D084] py-1">
                  {t.footer.risk}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Risk Disclosure Box */}
        <div className="rounded-xl border border-gray-800 bg-[#0d121b] p-4 text-left">
          <div className="flex items-center gap-2 mb-2 text-[#00D084] font-black text-xs uppercase tracking-wider">
            <ShieldCheck className="size-4 text-[#00D084]" />
            <span>{t.footer.disclaimerTitle.toUpperCase()}</span>
          </div>
          <p className="font-medium text-gray-400 text-[11px] leading-relaxed">
            {t.footer.disclaimerText}
          </p>
        </div>

        {/* Mobile Copyright & Bottom Legal Links */}
        <div className="border-t border-white/[0.06] pt-4 text-center space-y-2 text-[11px] text-gray-500">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link to="/terms" className="hover:text-[#00D084]">{t.footer.terms}</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-[#00D084]">{t.footer.privacy}</Link>
            <span>•</span>
            <Link to="/cookies" className="hover:text-[#00D084]">{t.footer.cookies}</Link>
            <span>•</span>
            <Link to="/legal" className="hover:text-[#00D084]">{t.footer.legal}</Link>
          </div>
          <p className="font-bold text-gray-400">
            © {new Date().getFullYear()} Nexium Markets. {t.footer.rights}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP FOOTER (UNTOUCHED, PRESERVED EXACTLY AS BEFORE: hidden lg:block)*/}
      {/* ========================================================================= */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-7xl px-6 md:px-8 pt-16 pb-14">
          {/* Main Footer Links & Brand Grid */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
            {/* Brand Info & Mission */}
            <div className="lg:col-span-2 flex flex-col items-start gap-5">
              <Link to="/" className="flex flex-col justify-center leading-none group py-1">
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-[0.22em] uppercase font-mono drop-shadow-[0_2px_15px_rgba(255,255,255,0.15)] group-hover:text-[#00D084] transition-colors duration-300">
                    NEXIUM
                  </span>
                  <span className="h-5 sm:h-6 w-px bg-gradient-to-b from-[#00D084] to-transparent opacity-80" />
                  <span className="text-sm sm:text-base font-extrabold text-[#00D084] tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(0,208,132,0.3)]">
                    MARKETS
                  </span>
                </div>
                <span className="mt-1.5 text-[10px] sm:text-xs font-extrabold text-gray-400 tracking-[0.35em] uppercase font-sans group-hover:text-white transition-colors">
                  {t.nav.brandSub}
                </span>
              </Link>

              <p className="max-w-md text-sm sm:text-base leading-relaxed text-gray-300 font-medium">
                {t.footer.tagline}
              </p>

              {/* Platform Certification Badge */}
              <div className="mt-1 inline-flex items-center gap-3 rounded-2xl border border-gray-800 bg-[#051a10] px-4 py-3 text-sm font-bold text-white shadow-lg">
                <span className="text-[#00D084] font-black text-base">MT5</span>
                <span className="text-gray-200">
                  {language === "fr" ? "ROBOTS CERTIFIÉS" : "CERTIFIED EXPERT ADVISORS"}{" "}
                  <strong className="text-white font-extrabold ml-1">MetaTrader 5</strong>
                </span>
              </div>
            </div>

            {/* Column 1: Platform / Écosystème */}
            <div className="flex flex-col gap-4 text-sm sm:text-base">
              <h4 className="text-base font-black text-white tracking-wider uppercase border-b border-gray-800/80 pb-2">
                {t.footer.colPlatform}
              </h4>
              <Link
                to="/robots"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.nav.robots}
              </Link>
              <Link
                to="/how-it-works"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.nav.howItWorks}
              </Link>
              <Link
                to="/performance"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.nav.performance}
              </Link>
              <Link
                to="/pricing"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {language === "fr" ? "Tarifs & Licences" : "Pricing & Licenses"}
              </Link>
              <Link
                to="/login"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.nav.clientArea}
              </Link>
            </div>

            {/* Column 2: Resources */}
            <div className="flex flex-col gap-4 text-sm sm:text-base">
              <h4 className="text-base font-black text-white tracking-wider uppercase border-b border-gray-800/80 pb-2">
                {language === "fr" ? "Ressources" : "Resources"}
              </h4>
              <Link
                to="/about"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {language === "fr" ? "Sécurité & Technologie" : "Security & Infrastructure"}
              </Link>
              <Link
                to="/faq"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                FAQ
              </Link>
              <Link
                to="/blog"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {language === "fr" ? "Blog & Actualités" : "Blog & Market Insights"}
              </Link>
              <Link
                to="/about"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {language === "fr" ? "À propos" : "About Us"}
              </Link>
              <Link
                to="/contact"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                Contact
              </Link>
            </div>

            {/* Column 3: Compte & Légal */}
            <div className="flex flex-col gap-3.5 text-sm sm:text-base">
              <h4 className="text-base font-black text-white tracking-wider uppercase border-b border-gray-800/80 pb-2">
                {t.footer.colLegal}
              </h4>
              <Link
                to="/login"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.nav.login}
              </Link>
              <Link
                to="/register"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.nav.openAccount}
              </Link>
              <Link
                to="/terms"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.footer.terms}
              </Link>
              <Link
                to="/privacy"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.footer.privacy}
              </Link>
              <Link
                to="/cookies"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300 flex items-center gap-1.5"
              >
                {t.footer.cookies}
              </Link>
              <Link
                to="/legal"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.footer.legal}
              </Link>
              <Link
                to="/risk-disclosure"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {t.footer.risk}
              </Link>
            </div>
          </div>

          {/* Bottom Disclaimer Card (Harmonized Soft Dark Theme) */}
          <div className="mt-14 rounded-2xl border border-gray-800/90 bg-[#131720] p-6 sm:p-8 text-center shadow-2xl">
            <div className="flex items-center justify-center gap-2 mb-3 text-[#00D084] font-black text-xs sm:text-sm uppercase tracking-wider">
              <ShieldCheck className="size-4 sm:size-5 text-[#00D084]" />
              <span>{t.footer.disclaimerTitle.toUpperCase()}</span>
            </div>
            <p className="max-w-4xl mx-auto font-medium text-gray-300 text-xs sm:text-sm leading-relaxed">
              {t.footer.disclaimerText}
            </p>
          </div>
        </div>

        {/* ULTRA-BOTTOM FULL-WIDTH STRIP */}
        <div className="w-full border-t border-gray-800/90 bg-[#020408] py-6 text-xs text-gray-400 font-medium">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <Link to="/legal" className="hover:text-[#00D084] transition-colors">
                {t.footer.legal}
              </Link>
              <span className="text-gray-700">•</span>
              <Link to="/privacy" className="hover:text-[#00D084] transition-colors">
                {t.footer.privacy}
              </Link>
              <span className="text-gray-700">•</span>
              <Link to="/cookies" className="hover:text-[#00D084] transition-colors">
                {t.footer.cookies}
              </Link>
              <span className="text-gray-700">•</span>
              <Link to="/terms" className="hover:text-[#00D084] transition-colors">
                {t.footer.terms}
              </Link>
              <span className="text-gray-700">•</span>
              <Link to="/risk-disclosure" className="hover:text-[#00D084] transition-colors">
                {t.footer.risk}
              </Link>
            </div>

            <p className="text-xs text-gray-400 font-bold">
              © {new Date().getFullYear()} Nexium Markets. {t.footer.rights}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
