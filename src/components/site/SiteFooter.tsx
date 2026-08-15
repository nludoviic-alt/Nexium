import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { LanguageSelector } from "@/components/site/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

export function SiteFooter() {
  const { language, t } = useLanguage();

  return (
    <footer className="w-full bg-[#05080e] text-gray-300 border-t border-[#00D084]/20">
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
              to="/pricing"
              className="hover:text-[#00D084] transition-colors font-semibold text-gray-300"
            >
              {language === "fr" ? "Tarifs & Licences" : "Pricing & Licenses"}
            </Link>
            <Link
              to="/portal"
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

          <div className="flex items-center gap-4">
            <LanguageSelector variant="footer" />
            <p className="text-xs text-gray-400 font-bold">
              © {new Date().getFullYear()} Nexium Markets. {t.footer.rights}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
