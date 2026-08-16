import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 animate-in fade-in zoom-in-95 duration-200">
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={language === "fr" ? "Retour en haut" : "Back to top"}
        className="group relative flex size-12 items-center justify-center rounded-2xl border border-[#00D084]/35 bg-[#070b14]/90 text-[#00D084] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(0,208,132,0.25)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#00D084] hover:bg-[#00D084] hover:text-slate-950 hover:shadow-[0_0_25px_rgba(0,208,132,0.45)] active:scale-95 cursor-pointer"
      >
        <ArrowUp className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
