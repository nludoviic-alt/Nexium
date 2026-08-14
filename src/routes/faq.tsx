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
import { faqs } from "@/data/faq";

const faqCategories = [
  { id: "all", label: "Toutes les questions", icon: HelpCircle },
  { id: "licensing", label: "Licences & MT5", icon: Cpu },
  { id: "security", label: "Sécurité & Broker", icon: ShieldCheck },
  { id: "vps", label: "VPS & Latence", icon: Cpu },
  { id: "billing", label: "Abonnements", icon: CreditCard },
] as const;

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Centre d'Aide & Questions Fréquentes | Nexium Markets" },
      {
        name: "description",
        content:
          "Toutes les réponses sur les licences robots MetaTrader 5, la sécurité des comptes, le VPS et l'infrastructure d'exécution.",
      },
      { property: "og:title", content: "FAQ — Nexium Markets" },
      {
        property: "og:description",
        content: "Licences, connexion MetaTrader 5, sécurité et abonnements.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 1: true });

  const toggleItem = (id: number) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = faqs.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageShell>
      {/* Original PageHeader */}
      <PageHeader
        eyebrow="CENTRE D'AIDE"
        title="Questions Fréquentes"
        description="Toutes les réponses sur les licences robots, la connexion MetaTrader 5, la sécurité de votre compte et la gestion de votre abonnement."
      />

      {/* Main Body Section - Bright Modern Hybrid Canvas */}
      <section className="bg-[#f8f9fc] py-12 sm:py-16 px-4">
        <div className="mx-auto max-w-5xl">
          {/* Interactive Search Bar */}
          <div className="mb-8 mx-auto max-w-xl relative">
            <Search className="absolute left-4 top-3.5 size-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une question (ex: VPS, licence, sécurité)..."
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? "bg-black text-white shadow-lg scale-105"
                      : "bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-100 hover:text-gray-900 shadow-sm"
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? "text-[#00ff66]" : "text-gray-500"}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* FAQ Accordion Cards List */}
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
                Aucune question ne correspond à votre recherche. Veuillez essayer d'autres mots
                clés.
              </div>
            )}
          </div>

          {/* Bottom Support CTA Card */}
          <div className="mt-14 rounded-3xl bg-gradient-to-r from-[#012812] to-[#00180a] p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-[#00ff66]/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-[#00ff66]/15 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-2 text-center sm:text-left">
              <h3 className="text-2xl font-black text-white tracking-tight">
                Vous avez encore une question ?
              </h3>
              <p className="text-sm text-gray-300 font-medium max-w-md">
                Notre équipe d'assistance institutionnelle est disponible 24/7 pour vous aider dans
                la configuration de vos robots MT5.
              </p>
            </div>

            <Button
              asChild
              className="relative z-10 bg-[#00ff66] text-black hover:bg-[#00e65c] rounded-xl px-6 py-3.5 text-sm font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)] shrink-0"
            >
              <Link to="/contact" className="flex items-center gap-2">
                <span>Contacter le Support</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
