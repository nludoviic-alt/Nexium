import { Link, createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Cpu, Activity, Server, Zap, ArrowRight } from "lucide-react";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos de Nexium Markets" },
      {
        name: "description",
        content:
          "Nexium Markets développe une infrastructure de gestion pour robots de trading MetaTrader 5 : licences, monitoring et analytics.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { language, t } = useLanguage();

  const values = [
    {
      title: t.about.val1Title,
      text: t.about.val1Desc,
      icon: Activity,
      color: "text-[#00c853] bg-emerald-50 border-emerald-100",
    },
    {
      title: t.about.val2Title,
      text: t.about.val2Desc,
      icon: ShieldCheck,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: t.about.val3Title,
      text: t.about.val3Desc,
      icon: Cpu,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
  ];

  const pillars = [
    {
      num: t.about.pillar1Num,
      title: t.about.pillar1Title,
      desc: t.about.pillar1Desc,
    },
    {
      num: t.about.pillar2Num,
      title: t.about.pillar2Title,
      desc: t.about.pillar2Desc,
    },
    {
      num: t.about.pillar3Num,
      title: t.about.pillar3Title,
      desc: t.about.pillar3Desc,
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={t.about.badge}
        title={t.about.title}
        description={t.about.subtitle}
      />

      {/* Top Section - Glowing Dark Cards for Core Values */}
      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="bg-[#05170b]/90 rounded-3xl p-8 border border-[#00ff66]/20 hover:border-[#00ff66]/50 transition-all duration-300 shadow-xl hover:-translate-y-1.5 group flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 size-32 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00ff66]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div>
                  <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#00ff66] mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="size-6" />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight group-hover:text-[#00ff66] transition-colors">
                    {v.title}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-300 font-medium">
                    {v.text}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-gray-400">
                  <span>{language === "fr" ? "GARANTIE NEXIUM" : "NEXIUM STANDARD"}</span>
                  <span className="size-2 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66]" />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Main Bright Modern Light Section */}
      <section className="bg-[#f8f9fc] py-16 px-4 border-t border-b border-gray-200">
        <div className="mx-auto max-w-6xl space-y-16">
          {/* Pillars Grid */}
          <div>
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-extrabold text-[#00c853] uppercase tracking-widest flex items-center gap-2">
                <Server className="size-4" />
                <span>{language === "fr" ? "PILIERS DE L'INFRASTRUCTURE" : "INFRASTRUCTURE PILLARS"}</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-1">
                {language === "fr" ? "Les 3 Piliers de Notre Technologie" : "The 3 Pillars of our Technology"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pillars.map((p) => (
                <div
                  key={p.num}
                  className="bg-white rounded-[28px] p-8 border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group"
                >
                  <div>
                    <span className="inline-block rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-mono font-black text-emerald-800 border border-emerald-100 mb-5">
                      {p.num}
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight leading-snug group-hover:text-emerald-900 transition-colors">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-gray-600 font-medium">
                      {p.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-400">
                    <span>{language === "fr" ? "ACCÉLÉRATION NY4" : "NY4 ACCELERATED"}</span>
                    <Zap className="size-4 text-[#00c853]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="rounded-[32px] bg-gradient-to-r from-[#012812] via-[#011d0d] to-[#001409] p-8 sm:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl border border-[#00ff66]/25 relative overflow-hidden">
            <div className="relative z-10 space-y-3 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#00ff66]">
                <ShieldCheck className="size-4.5" />
                <span>{language === "fr" ? "EXPÉRIENCE INSTITUTIONNELLE" : "INSTITUTIONAL GRADE"}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {language === "fr" ? "Prêt à automatiser votre trading ?" : "Ready to automate your trading?"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                {language === "fr"
                  ? "Consultez notre catalogue de robots certifiés ou découvrez nos offres d'abonnement."
                  : "Explore our certified MT5 Expert Advisors or choose your subscription plan."}
              </p>
            </div>

            <Button
              asChild
              className="relative z-10 bg-[#00ff66] text-black hover:bg-[#00e65c] rounded-2xl px-8 py-4 text-sm font-black uppercase tracking-wider transition-all duration-300 shadow-[0_0_25px_rgba(0,255,102,0.45)] hover:scale-105 shrink-0"
            >
              <Link to="/robots" className="flex items-center gap-2">
                <span>{language === "fr" ? "Explorer les Robots" : "Explore Robots"}</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
