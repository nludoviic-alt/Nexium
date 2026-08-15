import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Headphones,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  UserCheck,
  X,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useLanguage } from "@/context/LanguageContext";
import {
  createLiveChatThread,
  getLiveChatThreads,
  LiveChatThread,
  sendLiveChatMessage,
  subscribeToLiveChatUpdates,
} from "@/lib/chat-router";
import { sendCustomDeskEmail } from "@/lib/resend";

type ChatMessage = {
  id: number;
  role: "bot" | "user" | "advisor";
  text: string;
  authorName?: string;
  ctaLabel?: string | undefined;
  ctaTo?: string | undefined;
  isOperatorPrompt?: boolean;
  operatorSubmitted?: boolean;
  userQuery?: string;
};

type Intent = {
  keywords: string[];
  isOperator?: boolean;
  textFr: string;
  textEn: string;
  ctaLabelFr: string;
  ctaLabelEn: string;
  ctaTo: string;
};

const INTENTS: Intent[] = [
  {
    keywords: [
      "operateur",
      "operator",
      "humain",
      "human",
      "conseiller",
      "advisor",
      "agent",
      "quelqu'un",
      "personne",
      "parler",
      "parler a un conseiller",
      "parler a un operateur",
      "joindre",
      "telephone",
      "rappel",
      "call",
    ],
    isOperator: true,
    textFr:
      "Je vous mets en relation directe avec notre Desk Opérateur. Renseignez votre contact ci-dessous pour qu'un conseiller prenne immédiatement en charge votre demande :",
    textEn:
      "I am connecting you directly with our Live Operations Desk. Please enter your contact details below so an advisor can take over:",
    ctaLabelFr: "Formulaire de contact",
    ctaLabelEn: "Contact Form",
    ctaTo: "/contact",
  },
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
    keywords: ["support", "aide", "contact", "help", "ticket", "probleme"],
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

function findAnswer(query: string, lang: "fr" | "en"): {
  text: string;
  ctaLabel?: string;
  ctaTo?: string;
  isOperator?: boolean;
} {
  const q = normalize(query);

  for (const intent of INTENTS) {
    if (intent.keywords.some((k) => q.includes(normalize(k)))) {
      return {
        text: lang === "fr" ? intent.textFr : intent.textEn,
        ctaLabel: lang === "fr" ? intent.ctaLabelFr : intent.ctaLabelEn,
        ctaTo: intent.ctaTo,
        isOperator: intent.isOperator,
      };
    }
  }

  return {
    text:
      lang === "fr"
        ? "Je n'ai pas la réponse exacte à cette question précise. Souhaitez-vous que je transmette votre demande à un opérateur en direct ?"
        : "I don't have an exact answer for that query. Would you like me to forward your request to a live operator?",
    ctaLabel: lang === "fr" ? "Contacter un Opérateur" : "Contact Operator",
    ctaTo: "/contact",
    isOperator: true,
  };
}

export function ChatWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Active router live thread
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [liveThread, setLiveThread] = useState<LiveChatThread | null>(null);

  // Inline operator transfer form state
  const [operatorContact, setOperatorContact] = useState("");
  const [isSendingToOperator, setIsSendingToOperator] = useState(false);

  const greetingText =
    language === "fr"
      ? "Bonjour ! Je suis l'assistant IA Nexium. Comment puis-je vous aider avec vos robots MT5, licences ou transfert vers un opérateur ?"
      : "Hello! I am the Nexium AI Assistant. How can I help you today with MT5 bots, licenses, or connecting to a live operator?";

  const quickReplies =
    language === "fr"
      ? [
          "Parler à un opérateur 👨‍💼",
          "Ouvrir un compte MT5",
          "Robots IA certifiés",
          "Spreads & Latence NY4",
        ]
      : [
          "Speak to an Operator 👨‍💼",
          "Open MT5 Account",
          "Certified MT5 Bots",
          "Spreads & NY4 Latency",
        ];

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].role === "bot")) {
      setMessages([{ id: 0, role: "bot", text: greetingText }]);
    }
  }, [language]);

  // Real-time synchronization with the chat router
  useEffect(() => {
    const unsub = subscribeToLiveChatUpdates((threads) => {
      if (activeThreadId) {
        const found = threads.find((t) => t.id === activeThreadId);
        if (found) {
          setLiveThread(found);
        }
      }
    });
    return unsub;
  }, [activeThreadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, liveThread?.messages, isTyping, isSendingToOperator]);

  const sendMessage = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    // If we have an active assigned live advisor thread, send message through the router
    if (liveThread && liveThread.status === "ACTIVE") {
      sendLiveChatMessage({
        threadId: liveThread.id,
        sender: "VISITOR",
        authorName: liveThread.visitorName || "Visiteur",
        text,
      });
      setDraft("");
      return;
    }

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
          isOperatorPrompt: answer.isOperator,
          userQuery: text,
        },
      ]);
      setIsTyping(false);
    }, 500);
  };

  const handleOperatorSubmit = async (msgId: number, userQuery?: string) => {
    if (!operatorContact.trim()) {
      toast.error(
        language === "fr"
          ? "Veuillez entrer votre e-mail ou téléphone."
          : "Please enter your email or phone."
      );
      return;
    }

    setIsSendingToOperator(true);

    try {
      // 1. Create a live thread in the central Router (Claim Queue)
      const thread = createLiveChatThread({
        contact: operatorContact,
        initialQuery: userQuery || "Demande d'opérateur en direct",
        language,
      });
      setActiveThreadId(thread.id);
      setLiveThread(thread);

      // 2. Send backup dispatch notification email to desk
      await sendCustomDeskEmail(
        "support@nexiummarkets.com",
        `🚨 [CHATBOT DISPATCH] Demande d'opérateur en direct (${operatorContact})`,
        `Un visiteur a demandé à être mis en relation avec un opérateur en direct depuis le Chatbot du site.\n\n` +
          `• ID du fil : #${thread.id}\n` +
          `• Contact fourni : ${operatorContact}\n` +
          `• Question / Contexte : ${userQuery || "Demande de contact immédiat"}\n` +
          `• Date & Heure : ${new Date().toLocaleString("fr-FR")}\n\n` +
          `La demande est disponible dans l'onglet "File d'attente Direct" de la console Admin.`
      );

      // 3. Mark the message as submitted and push confirmation into chat
      setMessages((prev) =>
        prev
          .map((m) => (m.id === msgId ? { ...m, operatorSubmitted: true } : m))
          .concat({
            id: prev.length,
            role: "bot",
            text:
              language === "fr"
                ? `⏳ Votre demande a été placée en priorité dans la file d'attente du Desk Opérateur. Dès qu'un conseiller prend en charge votre fil, vous pourrez échanger en direct ici même.`
                : `⏳ Your request is prioritized in the Live Desk Queue. Once an advisor claims your thread, you can chat live here.`,
          })
      );

      toast.success(
        language === "fr"
          ? "Demande transmise avec succès à la file d'attente Desk !"
          : "Request queued for live operator!"
      );
      setOperatorContact("");
    } catch (err) {
      console.warn("Operator handoff notice:", err);
    } finally {
      setIsSendingToOperator(false);
    }
  };

  const isLiveWithAdvisor = liveThread && liveThread.status === "ACTIVE";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Expanded chat window */}
      {isOpen && (
        <div className="flex h-[550px] max-h-[82vh] w-[385px] max-w-[94vw] flex-col overflow-hidden rounded-[26px] border border-[#00D084]/35 bg-[#070b14]/98 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl mb-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3.5 bg-[#05080e]/95">
            <div className="flex items-center gap-3">
              {isLiveWithAdvisor ? (
                <span className="relative flex size-9 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <User className="size-4.5" />
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 animate-pulse" />
                </span>
              ) : (
                <span className="relative flex size-9 items-center justify-center rounded-2xl bg-[#00D084]/15 border border-[#00D084]/35 text-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.15)]">
                  <Bot className="size-4.5" />
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#00D084] animate-pulse" />
                </span>
              )}

              <div>
                <p className="text-xs font-black tracking-wide text-white uppercase font-mono flex items-center gap-1.5">
                  {isLiveWithAdvisor ? (
                    <>
                      <span>{liveThread.assignedAdvisor}</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        CONSEILLER DESK
                      </span>
                    </>
                  ) : (
                    <>
                      Nexium AI Assistant
                      <Sparkles className="size-3 text-[#00D084]" />
                    </>
                  )}
                </p>
                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span className="size-1.5 rounded-full bg-[#00D084]" />
                  {isLiveWithAdvisor
                    ? "Session en direct sécurisée"
                    : language === "fr"
                    ? "Opérateurs MT5 disponibles 24/7"
                    : "Live MT5 Operators Online 24/7"}
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

          {/* Banner if in Queue */}
          {liveThread && liveThread.status === "QUEUE" && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-3.5 py-2 flex items-center justify-between text-[11px] text-amber-300">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                <span>En file d'attente Desk (#{liveThread.id})</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400/80">Attente estimée &lt; 2 min</span>
            </div>
          )}

          {/* Banner if Active Advisor */}
          {isLiveWithAdvisor && (
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3.5 py-2 flex items-center justify-between text-[11px] text-emerald-300 font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>Conseiller connecté : {liveThread.assignedAdvisor}</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Canal Direct</span>
            </div>
          )}

          {/* Messages container */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 scrollbar-thin"
          >
            {/* Standard Bot Messages */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-medium shadow-md ${
                    m.role === "user"
                      ? "rounded-br-none bg-[#00D084] text-[#021a11] font-bold shadow-[0_2px_10px_rgba(0,208,132,0.2)]"
                      : "rounded-bl-none bg-slate-900/90 border border-slate-800 text-slate-200"
                  }`}
                >
                  {m.text}

                  {/* Inline Operator Transmission Card */}
                  {m.isOperatorPrompt && !m.operatorSubmitted && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#00D084]">
                        <Headphones className="size-3.5" />
                        <span>
                          {language === "fr" ? "Transfert Opérateur Direct" : "Live Operator Handoff"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="text"
                          value={operatorContact}
                          onChange={(e) => setOperatorContact(e.target.value)}
                          placeholder={
                            language === "fr"
                              ? "Votre e-mail ou tél. (ex: +33...)"
                              : "Your email or phone number"
                          }
                          className="w-full bg-[#05080e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:border-[#00D084] outline-none"
                        />
                        <button
                          type="button"
                          disabled={isSendingToOperator}
                          onClick={() => handleOperatorSubmit(m.id, m.userQuery)}
                          className="w-full bg-[#00D084] hover:bg-[#00b070] text-black font-extrabold text-[11px] py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          {isSendingToOperator ? (
                            <Loader2 className="size-3 animate-spin text-black" />
                          ) : (
                            <UserCheck className="size-3" />
                          )}
                          <span>
                            {isSendingToOperator
                              ? language === "fr"
                                ? "Transmission au Desk..."
                                : "Dispatching..."
                              : language === "fr"
                              ? "Envoyer la demande à un opérateur"
                              : "Forward to Operator"}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {m.operatorSubmitted && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-[#00D084] bg-[#00D084]/10 p-1.5 rounded-lg border border-[#00D084]/20">
                      <CheckCircle2 className="size-3" />
                      <span>
                        {language === "fr" ? "Demande en file d'attente Desk" : "Queued in Desk"}
                      </span>
                    </div>
                  )}
                </div>

                {m.ctaTo && !m.isOperatorPrompt && (
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

            {/* Live Advisor Messages if Thread is Active */}
            {liveThread &&
              liveThread.messages.length > 1 &&
              liveThread.messages.slice(1).map((lm) => {
                if (lm.sender === "SYSTEM") {
                  return (
                    <div key={lm.id} className="text-center my-2">
                      <span className="inline-block bg-slate-800/80 text-slate-400 text-[10px] font-medium px-3 py-1 rounded-full border border-slate-700">
                        {lm.text}
                      </span>
                    </div>
                  );
                }

                const isVisitor = lm.sender === "VISITOR";
                return (
                  <div
                    key={lm.id}
                    className={`flex flex-col ${isVisitor ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-medium shadow-md ${
                        isVisitor
                          ? "rounded-br-none bg-[#00D084] text-[#021a11] font-bold"
                          : "rounded-bl-none bg-emerald-950/70 border border-emerald-500/40 text-emerald-100"
                      }`}
                    >
                      <div className="flex justify-between gap-3 text-[10px] opacity-70 mb-1 font-mono">
                        <span>{lm.authorName}</span>
                        <span>{lm.timestamp}</span>
                      </div>
                      <p>{lm.text}</p>
                    </div>
                  </div>
                );
              })}

            {isTyping && (
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-none bg-slate-900/90 border border-slate-800 px-4 py-3 w-fit">
                <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-[#00D084] animate-bounce" />
              </div>
            )}

            {/* Quick replies chips */}
            {messages.length <= 1 && !liveThread && !isTyping && (
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
                placeholder={
                  isLiveWithAdvisor
                    ? "Répondre au conseiller en direct..."
                    : language === "fr"
                    ? "Posez une question ou demandez un opérateur..."
                    : "Ask a question or request an operator..."
                }
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

      {/* Floating Trigger Button */}
      {!isOpen && (
        <div
          className="flex flex-col items-end gap-2 group cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          {/* Ambient Prompt Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-[#070b14]/95 text-slate-200 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xl border border-[#00D084]/25 backdrop-blur-md group-hover:border-[#00D084] group-hover:shadow-[0_0_20px_rgba(0,208,132,0.2)] transition-all">
            <span className="size-1.5 rounded-full bg-[#00D084] animate-pulse" />
            <span>
              {language === "fr"
                ? "Besoin d'aide ? Assistant & Opérateur en ligne"
                : "Need assistance? AI & Live Desk Online"}
            </span>
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
