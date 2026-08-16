import { Check, ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useLanguage } from "@/context/LanguageContext";
import type { Language } from "@/i18n/translations";

// Clean, crisp SVG flags for maximum rendering sharpness
function FlagFR({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 480"
      className={`inline-block rounded-[2px] shadow-sm shrink-0 ${className}`}
      aria-hidden="true"
    >
      <g fillRule="evenodd" strokeWidth="1pt">
        <path fill="#fff" d="M0 0h640v480H0z" />
        <path fill="#00267f" d="M0 0h213.3v480H0z" />
        <path fill="#f31830" d="M426.7 0H640v480H426.7z" />
      </g>
    </svg>
  );
}

function FlagEN({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 480"
      className={`inline-block rounded-[2px] shadow-sm shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path fill="#012169" d="M0 0h640v480H0z" />
      <path
        fill="#FFF"
        d="m75 0 244 181L562 0h78v62L400 240l240 178v62h-80L320 301 81 480H0v-60l239-180L0 63V0h75z"
      />
      <path
        fill="#C8102E"
        d="m424 288 216 162v30h-40L384 318v-30h40zm-208-96L0 30V0h40l216 162v30h-40zM640 30 424 192h-40v-30L600 0h40v30zM0 450l216-162h40v30L40 480H0v-30z"
      />
      <path fill="#FFF" d="M240 0h160v480H240zM0 160h640v160H0z" />
      <path fill="#C8102E" d="M267 0h106v480H267zM0 187h640v106H0z" />
    </svg>
  );
}

interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
  region: string;
  flag: React.ComponentType<{ className?: string }>;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "fr",
    label: "FR",
    nativeName: "Français",
    region: "France / Europe",
    flag: FlagFR,
  },
  {
    code: "en",
    label: "EN",
    nativeName: "English",
    region: "Global / UK / US",
    flag: FlagEN,
  },
];

interface LanguageSelectorProps {
  variant?: "dropdown" | "segmented" | "compact" | "footer";
  className?: string;
  showIcon?: boolean;
}

export function LanguageSelector({
  variant = "dropdown",
  className = "",
  showIcon = true,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const CurrentFlag = currentLang.flag;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  /* ----------------------------------------------------
     VARIANT 1: SEGMENTED SWITCHER (Mobile & Auth & Fast Topbar)
  ---------------------------------------------------- */
  if (variant === "segmented") {
    return (
      <div
        className={`relative inline-flex items-center rounded-full bg-[#0c121d] p-0.5 border border-slate-700/70 shadow-[0_2px_10px_rgba(0,0,0,0.4)] backdrop-blur-md ${className}`}
      >
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;
          const FlagComponent = lang.flag;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLanguage(lang.code);
              }}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold tracking-wider rounded-full transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-[#00D084] text-slate-950 shadow-[0_0_12px_rgba(0,208,132,0.5)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FlagComponent className="w-3.5 h-2.5 rounded-[1px]" />
              <span>{lang.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ----------------------------------------------------
     VARIANT 2: COMPACT TOGGLE (Quick 1-click flip)
  ---------------------------------------------------- */
  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setLanguage(language === "fr" ? "en" : "fr");
        }}
        className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer border ${
          className ||
          "bg-slate-900/80 border-slate-700/80 text-slate-200 hover:border-[#00D084]/60 hover:text-white hover:shadow-[0_0_12px_rgba(0,208,132,0.2)]"
        }`}
        title={`Passer en ${language === "fr" ? "English" : "Français"}`}
      >
        {showIcon && <Globe className="size-3.5 text-[#00D084] transition-transform duration-300 group-hover:rotate-45" />}
        <CurrentFlag className="w-3.5 h-2.5" />
        <span className="tracking-wider">{currentLang.label}</span>
      </button>
    );
  }

  /* ----------------------------------------------------
     VARIANT 3: FOOTER SELECTOR (Sleek dark glass button)
  ---------------------------------------------------- */
  if (variant === "footer") {
    return (
      <div ref={dropdownRef} className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white bg-slate-900/80 hover:bg-slate-800/90 border border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
        >
          <CurrentFlag className="w-3.5 h-2.5" />
          <span>{currentLang.nativeName}</span>
          <ChevronDown
            className={`size-3 text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#00D084]" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-44 rounded-xl border border-gray-800 bg-[#0c1017] p-1.5 shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
            <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-800/80 mb-1">
              Langue / Language
            </div>
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              const FlagComponent = lang.flag;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#00D084]/15 text-[#00D084] font-bold"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FlagComponent className="w-4 h-3" />
                    <span>{lang.nativeName}</span>
                  </div>
                  {isSelected && <Check className="size-3.5 text-[#00D084]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ----------------------------------------------------
     VARIANT 4: DROPDOWN (Main Header & Topbar)
  ---------------------------------------------------- */
  return (
    <div ref={dropdownRef} className={`relative inline-block z-50 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="group relative flex items-center gap-2 rounded-full border border-slate-700/70 bg-[#0d131f]/90 px-2.5 py-1 text-xs font-bold text-slate-200 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-[#00D084]/60 hover:text-white hover:shadow-[0_0_12px_rgba(0,208,132,0.25)] cursor-pointer"
      >
        {showIcon && (
          <Globe className="size-3.5 text-[#00D084] transition-transform duration-300 group-hover:scale-110" />
        )}
        <div className="flex items-center gap-1.5">
          <CurrentFlag className="w-3.5 h-2.5" />
          <span className="tracking-wide">{currentLang.label}</span>
        </div>
        <ChevronDown
          className={`size-3 text-slate-400 transition-transform duration-200 group-hover:text-white ${
            isOpen ? "rotate-180 text-[#00D084]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-700/80 bg-[#090e17] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(0,208,132,0.15)] backdrop-blur-2xl z-[100] animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
            <span>Language</span>
            <span className="text-[#00D084]">NEXIUM</span>
          </div>

          <div className="flex flex-col gap-1">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              const FlagComponent = lang.flag;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`group/item flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-[#00D084]/15 text-[#00D084] font-bold border border-[#00D084]/40 shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FlagComponent className="w-4 h-3 shadow" />
                    <div className="flex flex-col items-start leading-tight">
                      <span className="font-bold">{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-500 group-hover/item:text-slate-400 font-normal">
                        {lang.region}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="flex items-center justify-center size-5 rounded-full bg-[#00D084]/20 border border-[#00D084]/40">
                      <Check className="size-3 text-[#00D084]" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {lang.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
