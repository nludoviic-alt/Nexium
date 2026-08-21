import { Link } from "@tanstack/react-router";
import { Cookie, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

const COOKIE_STORAGE_KEY = "nexium_cookie_consent_v1";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { language, t } = useLanguage();

  const [preferences, setPreferences] = useState({
    essential: true, // Always true
    telemetry: true,
    customization: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!saved) {
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(
        COOKIE_STORAGE_KEY,
        JSON.stringify({ essential: true, telemetry: true, customization: true, date: new Date().toISOString() })
      );
    } catch (e) {
      console.error(e);
    }
    setIsVisible(false);
    toast.success(language === "fr" ? "Préférences de cookies enregistrées (Tous acceptés)." : "Cookie preferences saved (All accepted).");
  };

  const handleRefuseOptional = () => {
    try {
      localStorage.setItem(
        COOKIE_STORAGE_KEY,
        JSON.stringify({ essential: true, telemetry: false, customization: false, date: new Date().toISOString() })
      );
    } catch (e) {
      console.error(e);
    }
    setIsVisible(false);
    toast.info(language === "fr" ? "Seuls les cookies strictement nécessaires sont activés." : "Only strictly necessary cookies are enabled.");
  };

  const handleSaveCustom = () => {
    try {
      localStorage.setItem(
        COOKIE_STORAGE_KEY,
        JSON.stringify({ ...preferences, essential: true, date: new Date().toISOString() })
      );
    } catch (e) {
      console.error(e);
    }
    setIsVisible(false);
    toast.success(language === "fr" ? "Vos préférences personnalisées ont été enregistrées." : "Your customized preferences have been saved.");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pointer-events-none">
      <aside
        aria-label="Cookie consent banner"
        className="pointer-events-auto mx-auto max-w-4xl rounded-[28px] border border-[#00D084]/30 bg-[#070b14]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-6 duration-500"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#00D084]/10 border border-[#00D084]/30 text-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.15)]">
              <Cookie className="size-6" />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00D084] font-mono">
                  {language === "fr" ? "GESTION DE LA VIE PRIVÉE & RGPD" : "PRIVACY & GDPR COMPLIANCE"}
                </span>
                <span className="size-1.5 rounded-full bg-[#00D084] animate-pulse" />
              </div>

              <h2 className="mt-1 text-lg sm:text-xl font-black text-white">
                {t.cookieBanner.title}
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
                {t.cookieBanner.desc}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
                <Link to="/cookies" className="text-[#00D084] underline hover:text-white transition-colors">
                  {t.cookieBanner.cookiePolicyLink}
                </Link>
                <span>•</span>
                <Link to="/privacy" className="text-gray-300 underline hover:text-white transition-colors">
                  {t.footer.privacy}
                </Link>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleAcceptAll}
              className="neon-btn rounded-xl px-6 py-3 text-xs font-black uppercase tracking-wider text-[#021a11] cursor-pointer hover:scale-105 transition-all text-center"
            >
              {t.cookieBanner.acceptAll}
            </button>

            <button
              onClick={handleRefuseOptional}
              className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:text-[#00D084] px-5 py-3 text-xs font-bold text-gray-200 transition cursor-pointer text-center"
            >
              {t.cookieBanner.rejectOptional}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-white py-1 transition cursor-pointer"
            >
              <Settings className="size-3.5" />
              {showSettings ? (language === "fr" ? "Masquer" : "Hide") : t.cookieBanner.customize}
            </button>
          </div>
        </div>

        {/* Expanded Customization Panel */}
        {showSettings && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-4 animate-in fade-in duration-300">
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Essential */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{t.cookieBanner.necessary}</span>
                  <span className="text-[10px] font-mono font-bold text-[#00D084] bg-[#00D084]/10 px-2 py-0.5 rounded-full">
                    {language === "fr" ? "Actif" : "Active"}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-gray-400">
                  {t.cookieBanner.necessaryDesc}
                </p>
              </div>

              {/* Telemetry */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{t.cookieBanner.analytics}</span>
                    <input
                      type="checkbox"
                      checked={preferences.telemetry}
                      onChange={(e) => setPreferences({ ...preferences, telemetry: e.target.checked })}
                      className="size-4 rounded accent-[#00D084] cursor-pointer"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400">
                    {t.cookieBanner.analyticsDesc}
                  </p>
                </div>
              </div>

              {/* Customization */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      {language === "fr" ? "3. Préférences" : "3. Preferences"}
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.customization}
                      onChange={(e) => setPreferences({ ...preferences, customization: e.target.checked })}
                      className="size-4 rounded accent-[#00D084] cursor-pointer"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400">
                    {language === "fr"
                      ? "Mémorisation des paramètres de dashboard et paires favorites."
                      : "Remembers dashboard settings and watchlist configurations."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveCustom}
                className="neon-btn rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#021a11] cursor-pointer hover:scale-105 transition-all"
              >
                {t.cookieBanner.save}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
