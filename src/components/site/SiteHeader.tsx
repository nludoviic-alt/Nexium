import { Link } from "@tanstack/react-router";
import { Menu, UserPlus, LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LanguageSelector } from "@/components/site/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/context/LanguageContext";

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [isTopBarHidden, setIsTopBarHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const { t } = useLanguage();

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
    if (open) {
      setIsTopBarHidden(false);
    }
  }, [open]);

  const mainNav = [
    { to: "/how-it-works", label: t.nav.howItWorks },
    { to: "/robots", label: t.nav.robots },
    { to: "/performance", label: t.nav.performance },
    { to: "/recouvrement", label: t.nav.recovery },
  ] as const;

  return (
    <header
      className={`z-50 w-full border-b border-[#00D084]/20 backdrop-blur-2xl transition-colors duration-300 ${
        transparent ? "fixed inset-x-0 top-0" : "sticky top-0"
      } ${transparent && !isScrolled ? "bg-[#0b0d10]/45" : "bg-[#0b0d10]/95"}`}
    >
      <div
        className={`relative z-50 border-[#00D084]/15 bg-[#070b12]/95 text-xs text-gray-300 transition-[max-height,opacity,border-width] duration-300 ease-out ${
          isTopBarHidden
            ? "max-h-0 overflow-hidden border-b-0 opacity-0 pointer-events-none"
            : "max-h-14 overflow-visible border-b opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex items-center gap-4 font-semibold tracking-wide">
            <Link
              to="/how-it-works"
              className="cursor-pointer text-xs font-extrabold tracking-wider text-[#00D084] uppercase hover:underline"
            >
              {t.nav.automation}
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

          <div className="hidden items-center gap-4 text-xs font-medium lg:flex">
            <Link to="/contact" className="transition-colors hover:text-white">
              {t.nav.support247}
            </Link>
            <span className="text-gray-700">|</span>

            {/* Premium Segmented Language Switch */}
            <LanguageSelector variant="segmented" />
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

        <div className="hidden items-center gap-3 lg:flex">
          {/* Quick switcher in sticky bar when scrolled */}
          {isTopBarHidden && (
            <div className="mr-1 animate-in fade-in zoom-in-95 duration-200">
              <LanguageSelector variant="segmented" />
            </div>
          )}

          {/* Bouton Inscription (Icône Circulaire Haute Finance) */}
          <Link
            to="/register"
            aria-label={t.nav.openAccount}
            title={t.nav.openAccount}
            className="group relative flex size-10 items-center justify-center rounded-full bg-[#00D084] text-black shadow-[0_0_16px_rgba(0,208,132,0.35)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_24px_rgba(0,208,132,0.6)] cursor-pointer"
          >
            <UserPlus className="size-4.5 transition-transform duration-300 group-hover:rotate-6" />
            <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0a0f18] border border-[#00D084]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-50">
              {t.nav.openAccount}
            </span>
          </Link>

          {/* Bouton Connexion (Icône Circulaire Minimaliste) */}
          <Link
            to="/login"
            aria-label={t.nav.login}
            title={t.nav.login}
            className="group relative flex size-10 items-center justify-center rounded-full border border-gray-700 bg-slate-900/80 text-gray-200 shadow-md transition-all duration-300 hover:border-[#00D084]/60 hover:bg-slate-800 hover:text-[#00D084] hover:scale-105 cursor-pointer"
          >
            <LogIn className="size-4.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0a0f18] border border-gray-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-200 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 z-50">
              {t.nav.login}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {/* Mobile direct quick switcher */}
          <LanguageSelector variant="compact" showIcon={false} className="bg-slate-900/90 border-slate-800 text-[11px] px-2.5 py-1" />

          {/* Quick Register Icon Mobile */}
          <Link
            to="/register"
            aria-label={t.nav.openAccount}
            title={t.nav.openAccount}
            className="flex size-9 items-center justify-center rounded-full bg-[#00D084] text-black shadow-sm"
          >
            <UserPlus className="size-4" />
          </Link>

          {/* Quick Login Icon Mobile */}
          <Link
            to="/login"
            aria-label={t.nav.login}
            title={t.nav.login}
            className="flex size-9 items-center justify-center rounded-full border border-gray-700 bg-slate-900 text-gray-200"
          >
            <LogIn className="size-4" />
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open menu"
                className="size-10 border-gray-600 bg-transparent text-white hover:border-[#00D084] hover:text-[#00D084]"
              >
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 border-l border-[#00D084]/20 bg-[#070b12] text-white"
            >
              <div className="mt-8 flex flex-col gap-4">
                {/* Mobile Language Switcher Card */}
                <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 mb-2 shadow-lg">
                  <span className="text-xs font-bold text-slate-300">{t.nav.langSwitch}</span>
                  <LanguageSelector variant="segmented" />
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
                    <Link to="/register" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2">
                      <UserPlus className="size-4" />
                      <span>{t.nav.openAccount}</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-gray-500 bg-transparent py-3 text-xs font-extrabold text-white hover:text-[#00D084]"
                  >
                    <Link to="/login" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2">
                      <LogIn className="size-4" />
                      <span>{t.nav.login}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
