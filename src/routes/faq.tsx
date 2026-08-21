import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  HelpCircle,
  ShieldCheck,
  Cpu,
  CreditCard,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

import { PageHeader, PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Centre d'Aide & Questions Fréquentes | Nexium Markets" },
      {
        name: "description",
        content:
          "Toutes les réponses sur les licences robots MetaTrader 5, la sécurité des comptes, le VPS et l'infrastructure d'exécution.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 1: true });

  const faqCategories = [
    { id: "all", label: t.faq.catAll, icon: HelpCircle },
    { id: "licensing", label: t.faq.catLicensing, icon: Cpu },
    { id: "security", label: t.faq.catSecurity, icon: ShieldCheck },
    { id: "vps", label: t.faq.catVps, icon: Cpu },
    { id: "billing", label: t.faq.catBilling, icon: CreditCard },
  ] as const;

  const faqsList = [
    {
      id: 1,
      category: "security",
      q: language === "fr" ? "Ai-je besoin de fournir le mot de passe de mon compte MetaTrader ?" : "Do I need to share my main MetaTrader trading password?",
      a: language === "fr"
        ? "Absolument pas. Seuls le nom du broker, le serveur MT5, le numéro de compte et le nom du titulaire sont enregistrés. Le mot de passe principal du terminal n'est jamais demandé ni stocké sur nos serveurs."
        : "Never. Only your broker name, server designation, and account number are verified. Your master terminal password is never requested, transmitted, or stored.",
      tag: language === "fr" ? "Sécurité" : "Security",
    },
    {
      id: 2,
      category: "licensing",
      q: language === "fr" ? "Comment fonctionne la licence d'un robot EA ?" : "How does the Expert Advisor license work?",
      a: language === "fr"
        ? "Chaque licence génère une clé de chiffrement unique liée à vos comptes MetaTrader 5 autorisés. Lors de l'initialisation dans MT5, le robot valide sa signature numérique en temps réel auprès de notre serveur de vérification."
        : "Each license generates a cryptographically signed key tied to your authorized MetaTrader 5 account ID. The EA verifies this signature in real time against our authorization servers upon initialization.",
      tag: language === "fr" ? "Licence" : "Licensing",
    },
    {
      id: 3,
      category: "licensing",
      q: language === "fr" ? "Comment savoir si mon robot fonctionne réellement en direct ?" : "How do I know if my robot is running live in real time?",
      a: language === "fr"
        ? "Le robot transmet un signal de présence (heartbeat telemetry) toutes les 60 secondes. Votre dashboard distingue la licence active de l'exécution réelle et affiche l'horodatage exact de la dernière communication."
        : "The robot transmits a telemetry heartbeat every 60 seconds. Your dashboard displays active connection status, latency, and the exact timestamp of the last heartbeat.",
      tag: language === "fr" ? "Monitoring" : "Monitoring",
    },
    {
      id: 4,
      category: "security",
      q: language === "fr" ? "Les performances affichées sont-elles garanties ?" : "Are historical performance returns guaranteed?",
      a: language === "fr"
        ? "Non. Le trading sur devises, indices et matières premières comporte un risque élevé de perte en capital. Les performances passées d'un robot ou d'un backtest ne garantissent aucunement les résultats futurs."
        : "No. Leveraged financial trading involves significant capital risk. Past algorithmic performances or backtests do not guarantee future trading results.",
      tag: language === "fr" ? "Avertissement" : "Risk Disclosure",
    },
    {
      id: 5,
      category: "vps",
      q: language === "fr" ? "Un serveur virtuel (VPS) est-il obligatoire ?" : "Is a Virtual Private Server (VPS) mandatory?",
      a: language === "fr"
        ? "Un VPS est fortement recommandé. Pour exécuter vos algorithmes 24h/24 sans interruption de connexion internet ni coupure de courant, le terminal MetaTrader 5 doit rester allumé en permanence."
        : "A VPS is strongly recommended. For 24/7 continuous trade execution without internet or power drops, your MT5 terminal should run uninterrupted on a co-located VPS.",
      tag: language === "fr" ? "Infrastructure" : "Infrastructure",
    },
    {
      id: 6,
      category: "billing",
      q: language === "fr" ? "Puis-je changer de plan ou annuler mon abonnement à tout moment ?" : "Can I upgrade or cancel my plan at any time?",
      a: language === "fr"
        ? "Oui, vous bénéficiez d'une liberté totale sans engagement. Vous pouvez mettre à jour ou résilier votre licence directement depuis votre espace client."
        : "Yes, you have full flexibility with zero lock-in contracts. You can upgrade, pause, or cancel your subscription anytime directly from your billing portal.",
      tag: language === "fr" ? "Facturation" : "Billing",
    },
    {
      id: 7,
      category: "vps",
      q: language === "fr" ? "Quel est le temps de latence recommandé pour le serveur VPS ?" : "What is the recommended VPS latency to broker servers?",
      a: language === "fr"
        ? "Pour maximiser la vitesse d'exécution et réduire le slippage, nous recommandons un VPS hébergé dans les mêmes datacenters que votre broker (ex: Equinix LD4 Londres ou NY4 New York avec une latence < 5ms)."
        : "To maximize execution velocity and minimize slippage, we recommend co-locating your VPS in Equinix NY4 (New York) or LD4 (London) with sub-5ms cross-connect latency.",
      tag: language === "fr" ? "Performance" : "Performance",
    },
  ];

  const toggleItem = (id: number) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = faqsList.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageShell>
      <PageHeader
        eyebrow={t.faq.badge}
        title={t.faq.title}
        description={t.faq.subtitle}
      />

      <section className="bg-[#f8f9fc] py-12 sm:py-16 px-4">
        <div className="mx-auto max-w-5xl">
          {/* Search Bar */}
          <div className="mb-8 mx-auto max-w-xl relative">
            <Search className="absolute left-4 top-3.5 size-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.faq.searchPlaceholder}
              className="w-full rounded-2xl border-gray-300 bg-white px-12 py-3.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:border-[#00ff66] focus:ring-2 focus:ring-[#00ff66]/20 transition-all shadow-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3 mb-10">
            {faqCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-black text-white shadow-lg scale-105"
                      : "bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-100 hover:text-[#00D084] shadow-sm"
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? "text-[#00ff66]" : "text-gray-500"}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((f) => {
                const isOpen = !!openItems[f.id];
                return (
                  <div
                    key={f.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? "border-[#00c853] shadow-md ring-1 ring-[#00c853]/20"
                        : "border-gray-200/80 shadow-sm hover:border-gray-300 hover:shadow"
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(f.id)}
                      className="w-full p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-start gap-3.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#00c853] font-black text-sm mt-0.5 border border-emerald-100">
                          ?
                        </span>
                        <div>
                          <div className="inline-block rounded-md bg-gray-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-gray-700 mb-1.5">
                            {f.tag}
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-snug">
                            {f.q}
                          </h3>
                        </div>
                      </div>
                      <span
                        className={`p-2 rounded-full transition-transform duration-200 ${isOpen ? "rotate-180 bg-gray-100 text-gray-900" : "text-gray-400"}`}
                      >
                        <ChevronDown className="size-5" />
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 pt-2 text-sm sm:text-base leading-relaxed text-gray-600 font-medium border-t border-gray-100 ml-10">
                        {f.a}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 font-medium">
                {language === "fr"
                  ? "Aucune question ne correspond à votre recherche. Veuillez essayer d'autres mots-clés."
                  : "No questions match your query. Please try searching with different keywords."}
              </div>
            )}
          </div>

          {/* Bottom Support CTA Card */}
          <div className="mt-14 rounded-3xl bg-gradient-to-r from-[#012812] to-[#00180a] p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-[#00ff66]/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-[#00ff66]/15 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2 text-center sm:text-left">
              <h3 className="text-2xl font-black text-white tracking-tight">
                {t.faq.stillQuestions}
              </h3>
              <p className="text-sm text-gray-300 font-medium max-w-md">
                {t.faq.stillQuestionsDesc}
              </p>
            </div>

            <Button
              asChild
              className="relative z-10 bg-[#00ff66] text-black hover:bg-[#00e65c] rounded-xl px-6 py-3.5 text-sm font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)] shrink-0"
            >
              <Link to="/contact" className="flex items-center gap-2">
                <span>{t.faq.contactSupportBtn}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
