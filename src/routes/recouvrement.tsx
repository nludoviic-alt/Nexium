import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Shield,
  FileSearch,
  Scale,
  CheckCircle2,
  Clock,
  Headphones,
  Lock,
  Zap,
  ShieldCheck,
  Award,
  Loader2,
  Building,
  DollarSign,
  AlertCircle,
  User,
  Mail,
  Phone,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { createLiveChatThread } from "@/lib/chat-router";
import { sendContactNotificationEmail } from "@/lib/resend";
import { notifyTelegramRecoveryDossier } from "@/lib/telegram";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/recouvrement")({
  head: () => ({
    meta: [
      {
        title: "Accompagnement Personnalisé Recouvrement de Fonds — Nexium Markets",
      },
      {
        name: "description",
        content:
          "Assistance confidentielle et prioritaire par notre Desk Spécialisé pour l'audit, le déblocage et la récupération de vos capitaux auprès d'opérateurs ou plateformes tiers.",
      },
      {
        property: "og:title",
        content: "Pôle Audit & Recouvrement de Fonds — Nexium Markets",
      },
      {
        property: "og:description",
        content:
          "Audit gratuit, médiation juridique et accompagnement expert pour récupérer vos avoirs bloqués. Rappel sous 2h ouvrées garanti.",
      },
    ],
  }),
  component: RecoveryAssistancePage,
});

function RecoveryAssistancePage() {
  const { language } = useLanguage();
  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [brokerPlatform, setBrokerPlatform] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [disputeType, setDisputeType] = useState("withdrawal_blocked");
  const [description, setDescription] = useState("");

  const [honeypot, setHoneypot] = useState("");
  const formLoadTimestamp = useRef<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDossierId, setSubmittedDossierId] = useState<string | null>(null);

  useEffect(() => {
    formLoadTimestamp.current = Date.now();
  }, []);

  // Auto pre-fill if logged in
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail((prev) => prev || user.email || "");
        supabase
          .from("profiles")
          .select("name, phone, recovery_assistance")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setFullName((prev) => prev || data.name || "");
              setPhone((prev) => prev || data.phone || "");
              if (data.recovery_assistance?.status === "PENDING" && data.recovery_assistance.dossier_id) {
                setSubmittedDossierId(data.recovery_assistance.dossier_id);
              }
            }
          });
      }
    });
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Anti-Spam Check : Honeypot furtif (attrape les robots remplissant les formulaires)
    if (honeypot.trim().length > 0) {
      console.warn("Spam bot detected via honeypot.");
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedDossierId(`REC-${Math.floor(100000 + Math.random() * 900000)}`);
      }, 800);
      return;
    }

    // 2. Anti-Spam Check : Détection de rapidité (scripts automatisés < 1.5 secondes)
    const elapsedSeconds = (Date.now() - formLoadTimestamp.current) / 1000;
    if (elapsedSeconds < 1.5) {
      toast.error(
        language === "fr"
          ? "Soumission trop rapide. Veuillez patienter quelques secondes."
          : "Submission too fast. Please wait a few seconds."
      );
      return;
    }

    // 3. Anti-Spam Check : Limiteur de cadence anti-flood (Max 3 requêtes / 10 min)
    const storageKey = "nexium_recovery_submissions_rate";
    try {
      const raw = localStorage.getItem(storageKey);
      const history: number[] = raw ? JSON.parse(raw) : [];
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const recent = history.filter((ts) => ts > tenMinutesAgo);
      if (recent.length >= 3) {
        toast.error(
          language === "fr"
            ? "Trop de demandes récentes. Veuillez patienter quelques minutes avant de réitérer."
            : "Too many recent submissions. Please wait a few minutes."
        );
        return;
      }
      recent.push(Date.now());
      localStorage.setItem(storageKey, JSON.stringify(recent));
    } catch {}

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error(
        language === "fr"
          ? "Veuillez renseigner votre nom, e-mail et numéro de téléphone."
          : "Please provide your full name, email and phone number."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error(
        language === "fr" ? "Veuillez fournir une adresse e-mail valide." : "Please provide a valid email address."
      );
      return;
    }

    setIsSubmitting(true);

    const generatedDossierId = `REC-${Date.now().toString().slice(-6)}`;
    const disputeLabel =
      disputeType === "withdrawal_blocked"
        ? "Refus ou blocage de retrait"
        : disputeType === "fees_demanded"
          ? "Exigence de taxes/frais abusifs préalables"
          : disputeType === "broker_unregulated"
            ? "Broker non régulé / disparition d'opérateur"
            : disputeType === "account_frozen"
              ? "Compte gelé ou suspension d'accès"
              : "Autre litige financier";

    try {
      const convId = `recovery-${Date.now().toString().slice(-6)}`;
      const summaryText = `[PÔLE RECOUVREMENT] Dossier: ${generatedDossierId} | Plateforme: ${brokerPlatform || "Non spécifiée"} | Montant: ${estimatedAmount || "Non spécifié"} | Type: ${disputeLabel} | Détails: ${description.trim() || "Aucune note"}`;

      if (isSupabaseConfigured) {
        const cleanEmail = email.trim().toLowerCase();

        // 1. Enregistrement dans les messages du Desk
        await supabase.from("email_conversations").insert([
          {
            id: convId,
            subject: `[RECOUVREMENT] Dossier ${generatedDossierId} — ${fullName.trim()}`,
            status: "INBOX",
            customer_email: cleanEmail,
            customer_name: fullName.trim(),
            preview: summaryText.slice(0, 120),
            unread: true,
          },
        ]);

        await supabase.from("email_messages").insert([
          {
            conversation_id: convId,
            from_address: cleanEmail,
            to_address: "support@nexiummarkets.com",
            subject: `[RECOUVREMENT] Dossier ${generatedDossierId} — ${fullName.trim()}`,
            body_text: `NOUVELLE DEMANDE D'ASSISTANCE AU RECOUVREMENT DE FONDS\n\nN° Dossier : ${generatedDossierId}\nClient : ${fullName.trim()}\nE-mail : ${cleanEmail}\nTéléphone : ${phone.trim()}\nOpérateur tiers : ${brokerPlatform.trim() || "Non spécifié"}\nMontant estimé : ${estimatedAmount.trim() || "Non spécifié"}\nNature du litige : ${disputeLabel}\n\nDescription :\n${description.trim() || "Aucune précision supplémentaire."}`,
            direction: "INBOUND",
          },
        ]);

        // 2. Si l'utilisateur est connecté, persister dans son profil
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const recoveryData = {
            requested_at: new Date().toISOString(),
            status: "PENDING",
            phone: phone.trim(),
            estimated_amount: estimatedAmount.trim() || undefined,
            notes: `Plateforme: ${brokerPlatform.trim() || "N/A"} | ${disputeLabel}. ${description.trim()}`,
            dossier_id: generatedDossierId,
          };

          await supabase
            .from("profiles")
            .update({
              recovery_assistance: recoveryData,
              phone: phone.trim(),
            })
            .eq("id", user.id);

          try {
            localStorage.setItem(`nexium_recovery_assistance_${user.id}`, JSON.stringify(recoveryData));
            window.dispatchEvent(new CustomEvent("nexium_recovery_assistance_updated", { detail: recoveryData }));
          } catch {}
        }
      }

      // 3. Notification en direct dans le routeur Chat du Desk
      createLiveChatThread({
        visitorName: fullName.trim(),
        contact: email.trim(),
        initialQuery: `🚨 [NOUVEAU DOSSIER RECOUVREMENT] Dossier ${generatedDossierId} | Tél: ${phone.trim()} | Opérateur: ${brokerPlatform || "Non spécifié"} | Montant: ${estimatedAmount || "N/A"}`,
        language: language as "fr" | "en",
      }).catch(() => {});

      // 4. Envoi email de notification au Desk
      sendContactNotificationEmail({
        fullName: fullName.trim(),
        email: email.trim(),
        subject: `[RECOUVREMENT] Dossier ${generatedDossierId} - ${fullName.trim()}`,
        message: `Montant: ${estimatedAmount} | Plateforme: ${brokerPlatform} | Litige: ${disputeLabel}\n\n${description}`,
      }).catch(() => {});

      // 5. Notification instantanée Telegram
      notifyTelegramRecoveryDossier({
        dossierId: generatedDossierId,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        brokerPlatform: brokerPlatform.trim() || undefined,
        estimatedAmount: estimatedAmount.trim() || undefined,
        disputeLabel,
        description: description.trim() || undefined,
      }).catch(() => {});

      // Backup local
      try {
        localStorage.setItem(
          "nexium_recovery_assistance_local",
          JSON.stringify({
            requested_at: new Date().toISOString(),
            status: "PENDING",
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            dossier_id: generatedDossierId,
          })
        );
      } catch {}

      setSubmittedDossierId(generatedDossierId);
      toast.success(
        language === "fr"
          ? "Votre demande de prise en charge a été enregistrée avec succès. Notre Desk vous contactera sous 2h ouvrées."
          : "Your assistance request has been received. Our Desk will contact you within 2 business hours."
      );
    } catch (err: any) {
      console.error("Erreur enregistrement dossier:", err);
      setSubmittedDossierId(generatedDossierId);
      toast.success(
        language === "fr"
          ? "Demande transmise à notre Pôle Recouvrement. Réf : " + generatedDossierId
          : "Request submitted. Ref: " + generatedDossierId
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      n: "01",
      title: language === "fr" ? "Dépôt & Audit Forensique Express" : "Case Filing & Forensic Audit",
      text:
        language === "fr"
          ? "Remplissage confidentiel de votre fiche et examen immédiat des preuves : historique MT4/MT5, relevés bancaires, hashs de transactions crypto TXID et correspondances."
          : "Confidential case intake and immediate review of evidence: MT4/MT5 logs, bank statements, blockchain TXIDs, and email correspondence.",
      icon: FileSearch,
      tag: language === "fr" ? "H+0 à H+2" : "H+0 to H+2",
    },
    {
      n: "02",
      title: language === "fr" ? "Médiation, Sommation & Mise en Demeure" : "Mediation & Formal Demand Notice",
      text:
        language === "fr"
          ? "Activation de nos leviers juridiques : mise en demeure officielle du courtier, signalement auprès des régulateurs de tutelle et contestation bancaire (chargeback ECN)."
          : "Activation of legal channels: formal notice of default, notification to relevant financial regulators, and payment processor disputes.",
      icon: Scale,
      tag: language === "fr" ? "Desk Juridique" : "Legal Desk",
    },
    {
      n: "03",
      title: language === "fr" ? "Déblocage & Restitution Intégrale" : "Unlocking & Full Capital Return",
      text:
        language === "fr"
          ? "Rapatriement direct de vos avoirs récupérés vers votre compte bancaire officiel ou votre wallet personnel vérifié, sans intermédiaire ni frais cachés."
          : "Direct repatriation of recovered funds back to your verified bank account or certified wallet without third-party diversions.",
      icon: CheckCircle2,
      tag: language === "fr" ? "Restitution Sécurisée" : "Secure Return",
    },
  ];

  return (
    <PageShell>
      {/* ═══════════════════════════════════════════════════════════════════════
          🌟 1. EN-TÊTE OFFICIEL PAGEHEADER (Exactement comme How It Works)
          ═══════════════════════════════════════════════════════════════════════ */}
      <PageHeader
        eyebrow={language === "fr" ? "PÔLE AUDIT & RECOUVREMENT" : "AUDIT & RECOVERY DESK"}
        title={
          language === "fr"
            ? "Accompagnement personnalisé pour récupérer vos fonds"
            : "Personalized Support to Recover Your Locked Funds"
        }
        description={
          language === "fr"
            ? "Assistance confidentielle et prioritaire par notre Desk Spécialisé pour l'audit, le déblocage et la récupération de vos capitaux auprès d'opérateurs ou plateformes tiers."
            : "Confidential and priority assistance by our Specialized Desk for auditing, unlocking, and recovering your capital from third-party operators or platforms."
        }
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          🌟 2. SECTION PRINCIPALE CLAIRE & ÉPURÉE (bg-[#f8f9fc])
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#f8f9fc] py-16 px-4 border-t border-b border-gray-200/80">
        <div className="mx-auto max-w-6xl space-y-16">
          {/* ── A. LES 3 ÉTAPES DU PROTOCOLE (Cartes identiques à how-it-works) ── */}
          <div>
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-extrabold text-[#00c853] uppercase tracking-widest flex items-center gap-2">
                <Zap className="size-4" />
                <span>{language === "fr" ? "PROTOCOLE D'INTERVENTION" : "RECOVERY WORKFLOW"}</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mt-1">
                {language === "fr"
                  ? "Le Protocole de Recouvrement en 3 Étapes"
                  : "The 3-Step Recovery Protocol"}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600 font-medium">
                {language === "fr"
                  ? "Une procédure d'audit et de médiation juridique structurée pour débloquer et restituer vos capitaux dans les plus brefs délais."
                  : "A structured audit and legal mediation procedure to unlock and return your capital promptly."}
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
                      <button
                        type="button"
                        onClick={scrollToForm}
                        className="text-xs font-black text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer"
                      >
                        {language === "fr" ? "Activer" : "Start"} <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── B. FORMULAIRE DÉDIÉ : COMPACT & ÉPURÉ EN 2 COLONNES SANS LIBELLÉ ── */}
          <div ref={formRef} className="pt-2">
            <div className="rounded-[28px] bg-gradient-to-br from-[#0c1322] via-[#09101d] to-[#05080e] p-6 sm:p-8 text-white shadow-2xl border border-blue-500/20 relative overflow-hidden">
              {/* Lueur d'ambiance bleue / émeraude */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/10 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

              {/* Header compact de la carte */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-500/15 border border-blue-400/30 text-blue-300">
                      <Shield className="size-3 text-blue-400" />
                      <span>{language === "fr" ? "PÔLE AUDIT & RECOUVREMENT" : "AUDIT & RECOVERY DESK"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
                      <span className="size-1.5 rounded-full bg-[#00ff66] animate-pulse" />
                      <span>{language === "fr" ? "PRIORITÉ VIP • RAPPEL 2H" : "VIP PRIORITY • 2H CALLBACK"}</span>
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {language === "fr"
                      ? "Accompagnement personnalisé pour récupérer vos fonds"
                      : "Personalized Support to Recover Your Funds"}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
                    <Lock className="size-3.5 text-[#00ff66]" />
                    <span>{language === "fr" ? "100% Confidentiel" : "100% Confidential"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
                    <Clock className="size-3.5 text-cyan-400" />
                    <span>{language === "fr" ? "Rappel sous 2h ouvrées" : "2h Callback"}</span>
                  </span>
                </div>
              </div>

              {submittedDossierId ? (
                /* Succès */
                <div className="bg-[#05080e]/80 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-4 animate-in fade-in">
                  <div className="size-14 rounded-full bg-emerald-500/20 text-[#00ff66] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,255,102,0.3)]">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-[#00ff66] uppercase tracking-wider">
                      {language === "fr" ? "DOSSIER ENREGISTRÉ" : "CASE REGISTERED"}
                    </span>
                    <h4 className="text-lg sm:text-xl font-black text-white">
                      {language === "fr"
                        ? "Votre demande a été prise en compte avec succès"
                        : "Your request has been successfully received"}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                      {language === "fr"
                        ? "Un spécialiste du Desk Litiges a été assigné. Vous serez recontacté par téléphone et e-mail sous 2 heures ouvrées."
                        : "A specialist from our Dispute Desk has been assigned. You will be contacted within 2 business hours."}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-3 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-xl font-mono text-xs sm:text-sm">
                    <span className="text-slate-400">{language === "fr" ? "Référence Dossier :" : "Case Ref :"}</span>
                    <strong className="text-emerald-400 font-bold text-sm sm:text-base">{submittedDossierId}</strong>
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      asChild
                      className="bg-[#00ff66] hover:bg-[#00d054] text-black font-black px-5 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <Link to="/login">{language === "fr" ? "Accéder à l'Espace Client" : "Go to Client Portal"}</Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSubmittedDossierId(null)}
                      className="text-xs font-bold text-slate-300 border-slate-700 hover:bg-slate-800 rounded-xl px-4 py-2"
                    >
                      {language === "fr" ? "Nouvelle demande" : "New request"}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Formulaire 2 colonnes sans libellé */
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Piège Honeypot furtif invisible pour l'humain mais attractif pour les bots */}
                  <div className="absolute opacity-0 -z-50 pointer-events-none h-0 w-0 overflow-hidden" aria-hidden="true">
                    <label htmlFor="website_security_token">Ne pas remplir</label>
                    <input
                      id="website_security_token"
                      type="text"
                      name="website_security_token"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Grille 2 Colonnes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Colonne Gauche (4 champs) */}
                    <div className="space-y-3">
                      {/* Nom & Prénom */}
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          required
                          aria-label={language === "fr" ? "Nom & Prénom" : "Full Name"}
                          placeholder={language === "fr" ? "Nom & Prénom *" : "Full Name *"}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-700/80 bg-[#0a1120] text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#00ff66] transition-colors"
                        />
                      </div>

                      {/* E-mail */}
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          required
                          aria-label={language === "fr" ? "Adresse e-mail" : "Email address"}
                          placeholder={language === "fr" ? "Adresse e-mail *" : "Email address *"}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-700/80 bg-[#0a1120] text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#00ff66] transition-colors"
                        />
                      </div>

                      {/* Téléphone direct */}
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          aria-label={language === "fr" ? "N° Téléphone direct (rappel sous 2h)" : "Phone number (2h callback)"}
                          placeholder={language === "fr" ? "N° Téléphone direct (rappel sous 2h) *" : "Phone number (2h callback) *"}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-700/80 bg-[#0a1120] text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#00ff66] transition-colors"
                        />
                      </div>

                      {/* Montant approximatif */}
                      <div className="relative">
                        <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          aria-label={language === "fr" ? "Montant approximatif bloqué" : "Estimated locked amount"}
                          placeholder={language === "fr" ? "Montant approximatif bloqué (ex: 25 000 USD / EUR)" : "Estimated locked amount (e.g. 25,000 USD / EUR)"}
                          value={estimatedAmount}
                          onChange={(e) => setEstimatedAmount(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-700/80 bg-[#0a1120] text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#00ff66] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Colonne Droite (Plateforme, Litige, Précisions) */}
                    <div className="space-y-3 flex flex-col justify-between">
                      {/* Plateforme / Courtier */}
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          aria-label={language === "fr" ? "Plateforme ou courtier concerné" : "Platform or broker name"}
                          placeholder={language === "fr" ? "Plateforme ou courtier concerné (ex: Nom du courtier)" : "Platform or broker name"}
                          value={brokerPlatform}
                          onChange={(e) => setBrokerPlatform(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-700/80 bg-[#0a1120] text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#00ff66] transition-colors"
                        />
                      </div>

                      {/* Nature du litige */}
                      <div className="relative">
                        <AlertCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                        <select
                          value={disputeType}
                          onChange={(e) => setDisputeType(e.target.value)}
                          aria-label={language === "fr" ? "Nature du litige" : "Dispute type"}
                          className="w-full h-11 pl-10 pr-9 rounded-xl border border-slate-700/80 bg-[#0a1120] text-sm text-white outline-none focus:border-[#00ff66] transition-colors cursor-pointer appearance-none"
                        >
                          <option value="withdrawal_blocked">
                            {language === "fr" ? "Litige : Refus ou blocage de retrait" : "Dispute: Refused/blocked withdrawal"}
                          </option>
                          <option value="fees_demanded">
                            {language === "fr" ? "Litige : Taxes ou commissions préalables exigées" : "Dispute: Demanded unlock fees/taxes"}
                          </option>
                          <option value="broker_unregulated">
                            {language === "fr" ? "Litige : Broker non régulé / Opérateur disparu" : "Dispute: Unregulated broker / ghost operator"}
                          </option>
                          <option value="account_frozen">
                            {language === "fr" ? "Litige : Compte MT4/MT5 gelé sans motif" : "Dispute: Frozen MT4/MT5 account"}
                          </option>
                          <option value="other">
                            {language === "fr" ? "Litige : Autre litige financier" : "Dispute: Other financial dispute"}
                          </option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                      </div>

                      {/* Précisions sur la situation */}
                      <div className="relative flex-1">
                        <MessageSquare className="absolute left-3.5 top-3 size-4 text-slate-400 pointer-events-none" />
                        <textarea
                          rows={2}
                          aria-label={language === "fr" ? "Précisions sur la situation" : "Additional details"}
                          placeholder={
                            language === "fr"
                              ? "Précisions sur la situation (dates, refus, montants... facultatif)"
                              : "Additional details (dates, broker responses... optional)"
                          }
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full h-[92px] pl-10 pr-4 py-2 rounded-xl border border-slate-700/80 bg-[#0a1120] text-sm text-white placeholder:text-slate-400 outline-none focus:border-[#00ff66] transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ligne d'action inférieure compacte */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="hero-watch-btn sm:w-auto px-6 h-11 rounded-xl text-xs font-black text-white uppercase tracking-wider shadow-[0_0_18px_rgba(0,208,132,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin text-white" />
                          <span>{language === "fr" ? "Envoi…" : "Submitting…"}</span>
                        </>
                      ) : (
                        <>
                          <Headphones className="size-4" />
                          <span>{language === "fr" ? "DEMANDER UNE ASSISTANCE" : "REQUEST ASSISTANCE"}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <ShieldCheck className="size-3.5 text-[#00ff66]" />
                      <span>{language === "fr" ? "100% Gratuit · Sans engagement · Traitement sous 2h" : "100% Free · No commitment · 2h Response"}</span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ── C. BANDEAU DE RÉASSURANCE INFÉRIEUR (Exactement comme how-it-works) ── */}
          <div className="rounded-[32px] bg-gradient-to-br from-gray-900 via-gray-900 to-black p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-2 max-w-3xl flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] text-xs font-bold font-mono">
                <ShieldCheck className="size-4" />
                <span>{language === "fr" ? "SÉCURITÉ & CONFIDENTIALITÉ GARANTIE" : "GUARANTEED SECURITY & SECRECY"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight sm:whitespace-nowrap">
                {language === "fr"
                  ? "Besoin d'un diagnostic confidentiel immédiat ?"
                  : "Need an immediate confidential case review?"}
              </h3>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                {language === "fr"
                  ? "Nos spécialistes en contentieux financiers et traçabilité on-chain examinent gratuitement vos pièces justificatives sous secret bancaire."
                  : "Our financial dispute and on-chain forensics specialists review your case files free of charge under professional secrecy."}
              </p>
            </div>

            <Button
              onClick={scrollToForm}
              className="bg-[#00ff66] hover:bg-[#00d054] text-black font-black px-8 py-6 rounded-2xl text-sm shadow-[0_0_25px_rgba(0,255,102,0.3)] hover:scale-105 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{language === "fr" ? "Ouvrir mon Dossier" : "Open My Case"}</span>
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
