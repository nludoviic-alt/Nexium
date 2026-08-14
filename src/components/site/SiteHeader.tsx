import { Link } from "@tanstack/react-router";
import { ChevronDown, Globe, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/context/LanguageContext";

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isTopBarHidden, setIsTopBarHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      // Keep the header accessible near the top and avoid flickering on tiny scroll movements.
      if (currentScrollY < 80) {
        setIsTopBarHidden(false);
      } else if (Math.abs(scrollDelta) > 10) {
        setIsTopBarHidden(scrollDelta > 0);
      }

      setIsScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (open || langDropdownOpen) {
      setIsTopBarHidden(false);
    }
  }, [langDropdownOpen, open]);

  const mainNav = [
    { to: "/how-it-works", label: t.nav.howItWorks },
    { to: "/robots", label: t.nav.robots },
    { to: "/performance", label: t.nav.performance },
  ] as const;

  return (
    <header
      className={`z-50 w-full border-b border-[#00D084]/20 backdrop-blur-2xl transition-colors duration-300 ${
        transparent ? "fixed inset-x-0 top-0" : "sticky top-0"
      } ${transparent && !isScrolled ? "bg-[#0b0d10]/45" : "bg-[#0b0d10]/95"}`}
    >
      <div
        className={`overflow-hidden border-[#00D084]/15 bg-[#070b12]/95 text-xs text-gray-300 transition-[max-height,opacity,border-width] duration-300 ease-out ${
          isTopBarHidden ? "max-h-0 border-b-0 opacity-0" : "max-h-14 border-b opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-4 font-semibold tracking-wide">
            <Link
              to="/NEXIUM"
              className="cursor-pointer text-xs font-extrabold tracking-wider text-[#00D084] uppercase hover:underline"
            >
              {t.nav.clientArea}
            </Link>
            <span className="text-gray-700">|</span>
            <Link to="/about" className="text-xs transition-colors hover:text-[#00D084]">
              {t.nav.partners}
            </Link>
            <span className="text-gray-700">|</span>
            <Link to="/blog" className="text-xs transition-colors hover:text-[#00D084]">
              {t.nav.blog}
            </Link>
          </div>

          <div className="hidden items-center gap-4 text-xs font-medium md:flex">
            <Link to="/how-it-works" className="cursor-pointer transition-colors hover:text-white">
              {t.nav.automation}
            </Link>
            <span className="text-gray-700">|</span>
            <Link to="/about" className="cursor-pointer transition-colors hover:text-white">
              {t.nav.technology}
            </Link>
            <span className="text-gray-700">|</span>
            <Link to="/performance" className="cursor-pointer transition-colors hover:text-white">
              {t.nav.control}
            </Link>
            <span className="text-gray-700">|</span>
            <Link to="/contact" className="transition-colors hover:text-white">
              {t.nav.support247}
            </Link>
            <span className="text-gray-700">|</span>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 font-bold uppercase transition-colors hover:text-[#00D084] cursor-pointer bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/60"
              >
                <Globe className="size-3.5 text-[#00D084]" />
                <span>{language === "fr" ? "FR 🇫🇷" : "EN 🇬🇧"}</span>
                <ChevronDown className="size-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div
                  onMouseLeave={() => setLangDropdownOpen(false)}
                  className="absolute right-0 top-full mt-1.5 w-32 rounded-xl border border-slate-700 bg-[#080d18] p-1.5 shadow-2xl z-50 animate-in fade-in"
                >
                  <button
                    onClick={() => {
                      setLanguage("fr");
                      setLangDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                      language === "fr"
                        ? "bg-[#00D084]/15 text-[#00D084]"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span>Français</span>
                    <span>🇫🇷</span>
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("en");
                      setLangDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                      language === "en"
                        ? "bg-[#00D084]/15 text-[#00D084]"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span>English</span>
                    <span>🇬🇧</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8 ${
          transparent ? "bg-[#05080e]/35" : ""
        }`}
      >
        <Link to="/" className="group flex flex-col justify-center py-1 leading-none">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-2xl font-black tracking-[0.22em] text-white uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] transition-colors duration-300 group-hover:text-[#00D084] sm:text-3xl">
              NEXIUM
            </span>
            <span className="h-4 w-px bg-gradient-to-b from-[#00D084] to-transparent opacity-80 sm:h-5" />
            <span className="text-xs font-extrabold tracking-[0.3em] text-[#00D084] uppercase drop-shadow-[0_0_8px_rgba(0,208,132,0.3)] sm:text-sm">
              MARKETS
            </span>
          </div>
          <span className="mt-1 font-sans text-[9px] font-extrabold tracking-[0.35em] text-gray-400 uppercase transition-colors group-hover:text-white sm:text-[10px]">
            {t.nav.brandSub}
          </span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-base font-semibold tracking-wide text-gray-200 transition-colors hover:text-[#00D084]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Button
            asChild
            className="neon-btn rounded-full px-7 py-2.5 text-xs font-extrabold tracking-wider uppercase"
          >
            <Link to="/register">{t.nav.openAccount}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-gray-600 bg-transparent px-6 py-2.5 text-xs font-extrabold tracking-wider text-white uppercase hover:border-[#00D084]/50 hover:bg-gray-800"
          >
            <Link to="/login">{t.nav.login}</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Open menu"
              className="size-10 border-gray-600 bg-transparent text-white hover:border-[#00D084]"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-80 border-l border-[#00D084]/20 bg-[#070b12] text-white"
          >
            <div className="mt-8 flex flex-col gap-4">
              {/* Mobile Language Switcher */}
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 mb-2">
                <span className="text-xs font-bold text-slate-400">{t.nav.langSwitch}</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setLanguage("fr")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                      language === "fr"
                        ? "bg-[#00D084] text-black font-black"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    FR 🇫🇷
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                      language === "en"
                        ? "bg-[#00D084] text-black font-black"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    EN 🇬🇧
                  </button>
                </div>
              </div>

              {mainNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-lg font-semibold text-gray-100 hover:bg-[#00D084]/10 hover:text-[#00D084]"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  asChild
                  className="neon-btn rounded-full py-3 text-xs font-extrabold uppercase"
                >
                  <Link to="/register" onClick={() => setOpen(false)}>
                    {t.nav.openAccount}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-gray-500 bg-transparent py-3 text-xs font-extrabold text-white"
                >
                  <Link to="/login" onClick={() => setOpen(false)}>
                    {t.nav.login}
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
