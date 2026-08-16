import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string;
}

interface AdminDropdownProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const MENU_MARGIN = 8; // marge de sécurité par rapport au bord de l'écran
const MENU_PREFERRED_HEIGHT = 288; // ~ max-h-72

export function AdminDropdown<T extends string = string>({
  value,
  onChange,
  options,
  className = "",
  disabled = false,
  ariaLabel,
}: AdminDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number; openUp: boolean; maxHeight: number }>({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
    maxHeight: MENU_PREFERRED_HEIGHT,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Le menu est rendu dans un portail (document.body) en position fixe — ainsi
  // il ne peut jamais être rogné par un ancêtre en overflow-hidden/auto (modale,
  // panneau scrollable, etc.). On calcule sa position/hauteur à partir de
  // l'espace réellement disponible à l'écran, et on bascule vers le haut si
  // la place manque en bas, pour que les 7 rôles restent toujours visibles.
  const recalcPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_MARGIN;
    const spaceAbove = rect.top - MENU_MARGIN;

    const openUp = spaceBelow < MENU_PREFERRED_HEIGHT && spaceAbove > spaceBelow;
    const available = openUp ? spaceAbove : spaceBelow;
    setMenuStyle({
      top: openUp ? rect.top - MENU_MARGIN : rect.bottom + MENU_MARGIN,
      left: rect.left,
      width: rect.width,
      openUp,
      maxHeight: Math.max(120, Math.min(MENU_PREFERRED_HEIGHT, available)),
    });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) recalcPosition();
  }, [isOpen, recalcPosition]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("resize", recalcPosition);
    window.addEventListener("scroll", recalcPosition, true);
    return () => {
      window.removeEventListener("resize", recalcPosition);
      window.removeEventListener("scroll", recalcPosition, true);
    };
  }, [isOpen, recalcPosition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideTrigger = containerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-[#0c121e] px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-100 transition-all cursor-pointer select-none text-left ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20 bg-[#101828]"
            : "hover:border-slate-600 hover:bg-[#101828]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="truncate font-sans font-medium">{selectedOption?.label || value}</span>
          {selectedOption?.badge && (
            <span className="shrink-0 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-300">
              {selectedOption.badge}
            </span>
          )}
        </span>
        <ChevronDown
          className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen && !menuStyle.openUp ? "rotate-180 text-blue-400" : isOpen ? "text-blue-400" : ""
          }`}
        />
      </button>

      {/* Floating Menu Popover — rendu dans un portail en position fixe pour ne
          jamais être rogné par une modale/panneau en overflow-hidden, et bascule
          vers le haut quand la place manque en bas. */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={`fixed min-w-[240px] rounded-xl border border-slate-700/80 bg-[#0c1424]/95 backdrop-blur-md p-1.5 shadow-2xl shadow-black/80 z-[9999] animate-in fade-in zoom-in-95 duration-150 ${
              menuStyle.openUp ? "-translate-y-full" : ""
            }`}
            style={{ top: menuStyle.top, left: menuStyle.left, width: Math.max(menuStyle.width, 240) }}
          >
            <div
              className="overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700"
              style={{ maxHeight: menuStyle.maxHeight }}
            >
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isSelected
                              ? "bg-blue-500/25 border border-blue-400/40 text-blue-200"
                              : "bg-slate-700/50 border border-slate-600/50 text-slate-400"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check className="size-4 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
