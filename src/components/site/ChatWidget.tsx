import { Link } from "@tanstack/react-router";
import { Bot, MessageSquare, Send, X, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

type ChatMessage = {
  id: number;
  role: "bot" | "user";
  text: string;
  ctaLabel?: string | undefined;
  ctaTo?: string | undefined;
};

type Intent = {
  keywords: string[];
  textFr: string;
  textEn: string;
  ctaLabelFr: string;
  ctaLabelEn: string;
  ctaTo: string;
};

const INTENTS: Intent[] = [
  {
    keywords: ["compte", "account", "register", "inscription", "ouvrir", "open", "commencer", "start"],
    textFr: "Vous pouvez ouvrir un compte de trading ou associer votre terminal MetaTrader 5 en moins de 2 minutes.",
    textEn: "You can register your account or link your MetaTrader 5 terminal in under 2 minutes with instant verification.",
    ctaLabelFr: "Ouvrir un compte",
    ctaLabelEn: "Open Account",
    ctaTo: "/register",
  },
  {
    keywords: ["robot", "ea", "expert", "gold", "algo", "strategie", "strategy", "scalp"],
    textFr: "Nos robots IA (Nexium AI Gold, Trend Core, Index Reversion) sont certifiés MT5 avec protection Risk Governor intégrée.",
    textEn: "Our certified MT5 Expert Advisors (Nexium AI Gold, Trend Core, Index Reversion) include built-in Risk Governor controls.",
    ctaLabelFr: "Catalogue Robots MT5",
    ctaLabelEn: "MT5 Robot Catalog",
    ctaTo: "/robots",
  },
  {
    keywords: ["spread", "latence", "latency", "ny4", "equinix", "vps", "vitesse", "speed"],
    textFr: "Nos serveurs sont colocalisés par fibre chez Equinix NY4 (New York) avec une exécution moyenne sous 38ms et spreads bruts dès 0.0 pip.",
    textEn: "Our servers are cross-connected via optical fiber at Equinix NY4 (New York) featuring sub-38ms execution and 0.0 pip raw spreads.",
    ctaLabelFr: "Voir l'Infrastructure",
    ctaLabelEn: "View Infrastructure",
    ctaTo: "/performance",
  },
  {
    keywords: ["prix", "tarif", "pricing", "cout", "licence", "license", "pro", "ultimate"],
    textFr: "Consultez nos formules Starter, Pro et Ultimate pour activer vos licences matérielles Hardware-Bound.",
    textEn: "Explore our Starter, Pro, and Ultimate tiers to activate hardware-bound EA licenses.",
    ctaLabelFr: "Tarifs & Licences",
    ctaLabelEn: "Pricing & Licenses",
    ctaTo: "/pricing",
  },
  {
    keywords: ["dashboard", "nexium", "cockpit", "terminal", "suivi", "telemetrie", "live"],
    textFr: "Accédez au cockpit NEXIUM pour superviser vos positions, votre drawdown et la télémétrie en temps réel.",
    textEn: "Access the NEXIUM executive cockpit to supervise live positions, drawdown levels, and tick-by-tick telemetry.",
    ctaLabelFr: "Accéder au Dashboard",
    ctaLabelEn: "Access Cockpit",
    ctaTo: "/NEXIUM",
  },
  {
    keywords: ["support", "aide", "contact", "humain", "help", "ticket", "probleme"],
    textFr: "Notre équipe d'ingénieurs trading est disponible 24/7 via notre formulaire de contact et support dédié.",
    textEn: "Our algorithmic engineering desk is available 24/7 through our dedicated contact portal.",
    ctaLabelFr: "Contacter le Support",
    ctaLabelEn: "Contact Support Desk",
    ctaTo: "/contact",
  },
];

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findAnswer(query: string, lang: "fr" | "en"): { text: string; ctaLabel?: string; ctaTo?: string } {
  const q = normalize(query);

  for (const intent of INTENTS) {
    if (intent.keywords.some((k) => q.includes(normalize(k)))) {
      return {
        text: lang === "fr" ? intent.textFr : intent.textEn,
        ctaLabel: lang === "fr" ? intent.ctaLabelFr : intent.ctaLabelEn,
        ctaTo: intent.ctaTo,
      };
    }
  }

  return {
    text:
      lang === "fr"
        ? "Je n'ai pas la réponse exacte à cette question précise. Notre équipe d'assistance technique est joignable immédiatement 24/7."
        : "I don't have an exact match for that specific inquiry. Our dedicated 24/7 technical desk is ready to assist you directly.",
    ctaLabel: lang === "fr" ? "Contacter le Support" : "Contact Support",
    ctaTo: "/contact",
  };
}

export function ChatWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const greetingText =
    language === "fr"
      ? "Bonjour ! Je suis l'assistant IA Nexium. Comment puis-je vous aider avec vos robots MT5, licences ou infrastructures colocalisées ?"
      : "Hello! I am the Nexium AI Assistant. How can I help you today with your MT5 Expert Advisors, licenses, or collocated setups?";

  const quickReplies =
    language === "fr"
      ? ["Ouvrir un compte MT5", "Robots IA certifiés", "Spreads & Latence NY4", "Dashboard de contrôle"]
      : ["Open MT5 Account", "Certified MT5 Bots", "Spreads & NY4 Latency", "Executive Cockpit"];

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].role === "bot")) {
      setMessages([{ id: 0, role: "bot", text: greetingText }]);
    }
  }, [language]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { id: prev.length, role: "user", text }]);
    setDraft("");
    setIsTyping(true);

    window.setTimeout(() => {
      const answer = findAnswer(text, language);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          role: "bot",
          text: answer.text,
          ctaLabel: answer.ctaLabel,
          ctaTo: answer.ctaTo,
        },
      ]);
      setIsTyping(false);
    }, 550);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Expanded chat window */}
      {isOpen && (
        <div className="flex h-[520px] max-h-[80vh] w-[370px] max-w-[94vw] flex-col overflow-hidden rounded-[26px] border border-[#00D084]/30 bg-[#070b14]/95 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl mb-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3.5 bg-[#05080e]/90">
            <div className="flex items-center gap-3">
              <span className="relative flex size-9 items-center justify-center rounded-2xl bg-[#00D084]/15 border border-[#00D084]/35 text-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.15)]">
                <Bot className="size-4.5" />
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#00D084] animate-pulse" />
              </span>
              <div>
                <p className="text-xs font-black tracking-wide text-white uppercase font-mono flex items-center gap-1.5">
                  Nexium AI Assistant
                  <Sparkles className="size-3 text-[#00D084]" />
                </p>
                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span className="size-1.5 rounded-full bg-[#00D084]" />
                  {language === "fr" ? "Colocalisation NY4 • En ligne 24/7" : "NY4 Collocation • Online 24/7"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages container */}
          <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-medium shadow-md ${
                    m.role === "user"
                      ? "rounded-br-none bg-[#00D084] text-[#021a11] font-bold shadow-[0_2px_10px_rgba(0,208,132,0.2)]"
                      : "rounded-bl-none bg-slate-900/90 border border-slate-800 text-slate-200"
                  }`}
                >
                  {m.text}
                </div>
                {m.ctaTo && (
                  <Link
                    to={m.ctaTo}
                    onClick={() => setIsOpen(false)}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#00D084] hover:underline bg-[#00D084]/10 px-3 py-1 rounded-full border border-[#00D084]/30 hover:bg-[#00D084]/20 transition-all"
                  >
                    {m.ctaLabel}
                    <ArrowRight className="size-3" />
                  </Link>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-none bg-slate-900/90 border border-slate-800 px-4 py-3 w-fit">
                <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce" />
              </div>
            )}

            {/* Quick replies chips */}
            {messages.length <= 1 && !isTyping && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {quickReplies.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-[#00D084]/50 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-[#00D084] transition-all cursor-pointer shadow-sm text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(draft);
            }}
            className="border-t border-slate-800/80 p-3 bg-[#05080e]/95"
          >
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={language === "fr" ? "Posez votre question à l'assistant..." : "Ask the AI assistant..."}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-[#00D084] focus:outline-none transition-colors font-medium"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#00D084] text-[#021a11] hover:bg-[#10b981] hover:scale-105 transition-all font-black cursor-pointer shadow-[0_2px_10px_rgba(0,208,132,0.25)]"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Trigger Button (Harmonized Dark Slate & Emerald Theme) */}
      {!isOpen && (
        <div
          className="flex flex-col items-end gap-2 group cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          {/* Ambient Prompt Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-[#070b14]/95 text-slate-200 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xl border border-[#00D084]/25 backdrop-blur-md group-hover:border-[#00D084] group-hover:shadow-[0_0_20px_rgba(0,208,132,0.2)] transition-all">
            <span className="size-1.5 rounded-full bg-[#00D084] animate-pulse" />
            <span>{language === "fr" ? "Besoin d'aide ? Assistant en ligne" : "Need assistance? AI Online"}</span>
          </div>

          {/* Floating Action Button */}
          <button
            aria-label="Open chat"
            className="flex size-14 items-center justify-center rounded-2xl bg-[#070b14] text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-[#00D084]/35 hover:border-[#00D084] hover:scale-110 hover:shadow-[0_0_20px_rgba(0,208,132,0.35)] transition-all cursor-pointer relative overflow-hidden group/btn"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00D084]/15 via-transparent to-transparent pointer-events-none" />
            <MessageSquare className="size-6 text-[#00D084] group-hover/btn:scale-110 transition-transform" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-[#00D084] ring-2 ring-[#070b14] animate-pulse" />
          </button>
        </div>
      )}
    </div>
  );
}
