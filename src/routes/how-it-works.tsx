import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  UserPlus,
  Bot,
  Link2,
  KeyRound,
  Activity,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { PageHeader, PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "Comment ça marche — Quick Start | Nexium Markets" },
      {
        name: "description",
        content:
          "De la création du compte à l'activation de la licence : les 5 étapes pour connecter un robot MetaTrader 5 à votre dashboard.",
      },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const { language, t } = useLanguage();

  const steps = [
    {
      n: "01",
      title: t.howItWorks.step1Title,
      text: t.howItWorks.step1Desc,
      icon: UserPlus,
      tag: language === "fr" ? "Inscription" : "Registration",
    },
    {
      n: "02",
      title: t.howItWorks.step2Title,
      text: t.howItWorks.step2Desc,
      icon: Bot,
      tag: language === "fr" ? "Catalogue" : "Catalog",
    },
    {
      n: "03",
      title: t.howItWorks.step3Title,
      text: t.howItWorks.step3Desc,
      icon: Link2,
      tag: language === "fr" ? "Connexion" : "Connection",
    },
    {
      n: "04",
      title: t.howItWorks.step4Title,
      text: t.howItWorks.step4Desc,
      icon: KeyRound,
      tag: language === "fr" ? "Activation" : "Activation",
    },
    {
      n: "05",
      title: t.howItWorks.step5Title,
      text: t.howItWorks.step5Desc,
      icon: Activity,
      tag: language === "fr" ? "Monitoring" : "Monitoring",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={t.howItWorks.badge}
        title={t.howItWorks.title}
        description={t.howItWorks.subtitle}
      />

      <section className="bg-[#f8f9fc] py-16 px-4 border-t border-b border-gray-200/80">
        <div className="mx-auto max-w-6xl space-y-16">
          <div>
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-extrabold text-[#00c853] uppercase tracking-widest flex items-center gap-2">
                <Zap className="size-4" />
                <span>{language === "fr" ? "PARCOURS D'ACTIVATION" : "ACTIVATION WORKFLOW"}</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-1">
                {language === "fr" ? "Le Parcours d'Activation en 5 Étapes" : "The 5-Step Activation Journey"}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600 font-medium">
                {language === "fr"
                  ? "Un processus optimisé sans friction pour déployer vos robots EA en moins de 10 minutes."
                  : "A frictionless streamlined process to deploy your MT5 Expert Advisors in under 10 minutes."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.n}
                    className="bg-white rounded-[28px] p-8 border border-gray-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300 hover:-translate-y-1.5 relative group overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-emerald-50 via-emerald-50/30 to-transparent rounded-bl-[40px] pointer-events-none group-hover:scale-110 transition-transform duration-300" />

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-block rounded-full bg-emerald-50 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 border border-emerald-100 shadow-2xs">
                          {language === "fr" ? `Étape ${s.n}` : `Step ${s.n}`}
                        </span>
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-[#00c853] border border-emerald-500/20 group-hover:bg-[#00c853] group-hover:text-white transition-colors duration-300 shadow-sm">
                          <Icon className="size-6" />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 tracking-tight mt-6 group-hover:text-[#00c853] transition-colors">
                        {s.title}
                      </h3>

                      <p className="mt-3 text-sm text-gray-600 leading-relaxed font-normal">
                        {s.text}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-6 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 font-mono">
                        {s.tag}
                      </span>
                      <span className="text-xs font-black text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {language === "fr" ? "Détails" : "Details"} <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Callout */}
          <div className="rounded-[32px] bg-gradient-to-br from-gray-900 via-gray-900 to-black p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] text-xs font-bold font-mono">
                <ShieldCheck className="size-4" />
                <span>{language === "fr" ? "SÉCURITÉ GARANTIE" : "GUARANTEED SECURITY"}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                {t.howItWorks.ctaTitle}
              </h3>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                {t.howItWorks.ctaDesc}
              </p>
            </div>

            <Link to="/register">
              <Button className="bg-[#00ff66] hover:bg-[#00d054] text-black font-black px-8 py-6 rounded-2xl text-sm shadow-[0_0_25px_rgba(0,255,102,0.3)] hover:scale-105 transition cursor-pointer">
                <span>{t.howItWorks.ctaBtn}</span>
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
