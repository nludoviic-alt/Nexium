import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, ChevronDown, ArrowRight, Lock, ExternalLink, Activity } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  const { language, t } = useLanguage();
  const [openSection, setOpenSection] = useState<string | null>("platform");

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <footer className="w-full bg-[#05080e] text-gray-300 border-t border-[#00D084]/20 select-none">
      {/* ═══════════════════════════════════════════════════════════════════════
          📱 DEDICATED MOBILE FOOTER (Visible on Mobile & Tablets: lg:hidden)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="block lg:hidden px-4 pt-12 pb-8">
        {/* Mobile Brand Card */}
        <div className="flex flex-col items-center text-center gap-4">
          <Link to="/" className="flex flex-col items-center justify-center leading-none group py-1">
            <div className="flex items-center justify-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-[0.2em] uppercase font-mono group-hover:text-[#00D084] transition-colors">
                NEXIUM
              </span>
              <span className="h-5 w-px bg-gradient-to-b from-[#00D084] to-transparent opacity-80" />
              <span className="text-xs sm:text-sm font-extrabold text-[#00D084] tracking-[0.25em] uppercase drop-shadow-[0_0_10px_rgba(0,208,132,0.3)]">
                MARKETS
              </span>
            </div>
            <span className="mt-1.5 text-[9px] sm:text-[10px] font-extrabold text-gray-400 tracking-[0.3em] uppercase">
              {t.nav.brandSub}
            </span>
          </Link>

          <p className="text-xs sm:text-sm text-gray-400 font-normal leading-relaxed max-w-xs mx-auto">
            {t.footer.tagline}
          </p>

          {/* MT5 Certification Capsule */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#00D084]/30 bg-[#00D084]/10 px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
            <span className="size-2 rounded-full bg-[#00D084] animate-pulse" />
            <span className="text-[11px] font-bold text-[#00D084] uppercase tracking-wider">
              {language === "fr" ? "Expert Advisors MT5 Certifiés" : "Certified MT5 Expert Advisors"}
            </span>
          </div>

          {/* Quick Action Buttons for Mobile */}
          <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm mt-2">
            <Button
              asChild
              className="hero-watch-btn w-full h-11 rounded-xl text-xs font-black text-white tracking-wider uppercase shadow-[0_0_15px_rgba(0,208,132,0.25)]"
            >
              <Link to="/register" className="flex items-center justify-center gap-1.5">
                <span>{language === "fr" ? "Inscription" : "Register"}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-11 rounded-xl border border-white/20 bg-white/[0.04] text-xs font-bold text-white hover:bg-white/10"
            >
              <Link to="/login" className="flex items-center justify-center gap-1.5">
                <Lock className="size-3.5 text-[#00D084]" />
                <span>{language === "fr" ? "Connexion" : "Login"}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Accordion Navigation Cards */}
        <div className="mt-8 space-y-2.5 max-w-sm mx-auto">
          {/* Section 1: Platform */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1017] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("platform")}
              className="w-full flex items-center justify-between p-4 text-left font-black text-sm text-white uppercase tracking-wider"
            >
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-[#00D084]" />
                <span>{t.footer.colPlatform}</span>
              </div>
              <ChevronDown
                className={`size-4 text-gray-400 transition-transform duration-300 ${
                  openSection === "platform" ? "rotate-180 text-[#00D084]" : ""
                }`}
              />
            </button>
            {openSection === "platform" && (
              <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5 border-t border-white/5 text-xs font-medium text-gray-300 animate-fadeIn">
                <Link to="/robots" className="hover:text-[#00D084] py-1 transition-colors">
                  {t.nav.robots}
                </Link>
                <Link to="/how-it-works" className="hover:text-[#00D084] py-1 transition-colors">
                  {t.nav.howItWorks}
                </Link>
                <Link to="/performance" className="hover:text-[#00D084] py-1 transition-colors">
                  {t.nav.performance}
                </Link>
                <Link to="/login" className="hover:text-[#00D084] py-1 transition-colors">
                  {language === "fr" ? "Portail Client" : "Client Portal"}
                </Link>
                <Link to="/register" className="hover:text-[#00D084] py-1 transition-colors">
                  {language === "fr" ? "Ouvrir un Compte" : "Open an Account"}
                </Link>
              </div>
            )}
          </div>

          {/* Section 2: Resources */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1017] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("resources")}
              className="w-full flex items-center justify-between p-4 text-left font-black text-sm text-white uppercase tracking-wider"
            >
              <span>{language === "fr" ? "Ressources & Société" : "Resources & Company"}</span>
              <ChevronDown
                className={`size-4 text-gray-400 transition-transform duration-300 ${
                  openSection === "resources" ? "rotate-180 text-[#00D084]" : ""
                }`}
              />
            </button>
            {openSection === "resources" && (
              <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5 border-t border-white/5 text-xs font-medium text-gray-300 animate-fadeIn">
                <Link to="/about" className="hover:text-[#00D084] py-1 transition-colors">
                  {language === "fr" ? "Sécurité & Technologie" : "Security & Infrastructure"}
                </Link>
                <Link to="/faq" className="hover:text-[#00D084] py-1 transition-colors">
                  FAQ
                </Link>
                <Link to="/blog" className="hover:text-[#00D084] py-1 transition-colors">
                  {language === "fr" ? "Blog & Analyses" : "Blog & Market Insights"}
                </Link>
                <Link to="/about" className="hover:text-[#00D084] py-1 transition-colors">
                  {language === "fr" ? "À propos de Nexium" : "About Us"}
                </Link>
                <Link to="/contact" className="hover:text-[#00D084] py-1 transition-colors">
                  Contact
                </Link>
              </div>
            )}
          </div>

          {/* Section 3: Legal & Compliance */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1017] overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("legal")}
              className="w-full flex items-center justify-between p-4 text-left font-black text-sm text-white uppercase tracking-wider"
            >
              <span>{language === "fr" ? "Conformité & Légal" : "Compliance & Legal"}</span>
              <ChevronDown
                className={`size-4 text-gray-400 transition-transform duration-300 ${
                  openSection === "legal" ? "rotate-180 text-[#00D084]" : ""
                }`}
              />
            </button>
            {openSection === "legal" && (
              <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5 border-t border-white/5 text-xs font-medium text-gray-300 animate-fadeIn">
                <Link to="/terms" className="hover:text-[#00D084] py-1 transition-colors">
                  {t.footer.terms}
                </Link>
                <Link to="/privacy" className="hover:text-[#00D084] py-1 transition-colors">
                  {t.footer.privacy}
                </Link>
                <Link to="/cookies" className="hover:text-[#00D084] py-1 transition-colors">
                  {t.footer.cookies}
                </Link>
                <Link to="/legal" className="hover:text-[#00D084] py-1 transition-colors">
                  {t.footer.legal}
                </Link>
                <Link to="/risk-disclosure" className="hover:text-[#00D084] py-1 transition-colors">
                  {t.footer.risk}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Disclaimer Card */}
        <div className="mt-8 rounded-2xl border border-gray-800 bg-[#0c1017]/80 p-4.5 text-center max-w-sm mx-auto shadow-lg">
          <div className="flex items-center justify-center gap-1.5 mb-2 text-[#00D084] font-black text-xs uppercase tracking-wider">
            <ShieldCheck className="size-4 text-[#00D084]" />
            <span>{t.footer.disclaimerTitle.toUpperCase()}</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed font-normal">
            {t.footer.disclaimerText}
          </p>
        </div>

        {/* Mobile Copyright & Bottom Links */}
        <div className="mt-8 pt-6 border-t border-gray-800/80 flex flex-col items-center gap-3 text-center text-[11px] text-gray-500">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-gray-400 font-medium">
            <Link to="/legal" className="hover:text-[#00D084]">
              {t.footer.legal}
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-[#00D084]">
              {t.footer.privacy}
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-[#00D084]">
              {t.footer.terms}
            </Link>
            <span>•</span>
            <Link to="/risk-disclosure" className="hover:text-[#00D084]">
              {t.footer.risk}
            </Link>
          </div>
          <p className="font-semibold text-gray-400">
            © {new Date().getFullYear()} Nexium Markets. {t.footer.rights}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          💻 DESKTOP FOOTER (100% ORIGINAL & UNTOUCHED: hidden on mobile, visible on lg+)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 pt-16 pb-14">
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
                to="/login"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {language === "fr" ? "connexion" : "Client Portal"}
              </Link>
              <Link
                to="/register"
                className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
              >
                {language === "fr" ? "inscription" : "Open an Account"}
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
                {language === "fr" ? "Conformité & Légal" : "Compliance & Legal"}
              </h4>
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

        {/* ULTRA-BOTTOM FULL-WIDTH STRIP (PLUS BAS) */}
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

            <div>
              <p className="text-xs text-gray-400 font-bold">
                © {new Date().getFullYear()} Nexium Markets. {t.footer.rights}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
