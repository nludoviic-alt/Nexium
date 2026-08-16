import { createFileRoute } from "@tanstack/react-router";
import {
  Building,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader, PageShell, Section } from "@/components/site/PageShell";
import { useLanguage } from "@/context/LanguageContext";
import { createLiveChatThread } from "@/lib/chat-router";
import { sendContactNotificationEmail } from "@/lib/resend";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contactez l'Équipe Nexium Markets — Support & Assistance MT5" },
      {
        name: "description",
        content:
          "Contactez nos experts en trading algorithmique MT5 : support technique 24/7, licences de robots, intégration broker et partenariats.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { language, t } = useLanguage();

  const contactChannels = [
    {
      icon: Mail,
      title: language === "fr" ? "Support Technique & Quant" : "Technical & Quant Support",
      description: language === "fr" ? "Réponse garantie sous 2h ouvrées." : "Guaranteed response within 2 business hours.",
      contact: "support@nexiummarkets.com",
      badge: language === "fr" ? "Standard ECN" : "ECN Standard",
    },
    {
      icon: MessageSquare,
      title: language === "fr" ? "Desk Institutionnel" : "Institutional Desk",
      description: language === "fr" ? "Échanges chiffrés & comptes ECN VIP." : "Encrypted channels & ECN VIP accounts.",
      contact: "institutional@nexiummarkets.com",
      badge: language === "fr" ? "24/7 ECN" : "24/7 ECN",
    },
    {
      icon: PhoneCall,
      title: language === "fr" ? "Ligne Directe Opérations" : "Operations Direct Line",
      description: language === "fr" ? "Accompagnement téléphonique dédié." : "Dedicated priority phone desk.",
      contact: "+33 1 89 71 42 00",
      badge: language === "fr" ? "Prioritaire" : "Priority",
    },
  ];

  const reasons = [
    t.contact.topicTechnical,
    t.contact.topicCommercial,
    t.contact.topicPartnership,
    t.contact.topicOther,
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: reasons[0],
    mt5Account: "",
    broker: "",
    message: "",
  });
  // Piège anti-spam invisible (Honeypot)
  const [honeypot, setHoneypot] = useState("");
  const formLoadTimestamp = useRef<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    formLoadTimestamp.current = Date.now();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Anti-Spam Check : Honeypot (rempli uniquement par les robots)
    if (honeypot.trim().length > 0) {
      console.warn("Spam bot detected via honeypot.");
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
      }, 1000);
      return;
    }

    // 2. Anti-Spam Check : Soumission trop rapide (< 1.8s impossible pour un humain)
    const elapsedSeconds = (Date.now() - formLoadTimestamp.current) / 1000;
    if (elapsedSeconds < 1.8) {
      toast.error(
        language === "fr"
          ? "Soumission trop rapide. Veuillez patienter quelques secondes."
          : "Submission too fast. Please take your time."
      );
      return;
    }

    // 3. Anti-Spam Check : Limiteur de fréquence (Max 3 messages / 10 min)
    const storageKey = "nexium_contact_submissions_v1";
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]") as number[];
      const recent = stored.filter((t) => Date.now() - t < 10 * 60 * 1000);
      if (recent.length >= 4) {
        toast.error(
          language === "fr"
            ? "Trop de messages envoyés récemment. Veuillez patienter avant de renvoyer un formulaire."
            : "Too many messages sent recently. Please wait a few minutes."
        );
        return;
      }
    } catch {
      // Ignorer
    }

    // 4. Validation des champs
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error(
        language === "fr"
          ? "Veuillez remplir tous les champs obligatoires (*)."
          : "Please fill in all required fields (*)."
      );
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error(
        language === "fr" ? "Veuillez fournir une adresse e-mail valide." : "Please provide a valid email address."
      );
      return;
    }

    if (formData.message.trim().length < 10) {
      toast.error(
        language === "fr"
          ? "Votre message est trop court (10 caractères minimum)."
          : "Your message is too short (10 characters minimum)."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const convId = `ticket-${Date.now().toString().slice(-5)}`;
      const previewText = formData.message.slice(0, 100);

      // A. Enregistrement dans Supabase si configuré
      if (isSupabaseConfigured) {
        try {
          await supabase.from("email_conversations").insert([
            {
              id: convId,
              subject: `[Contact] ${formData.subject}`,
              status: "INBOX",
              customer_email: formData.email.trim(),
              customer_name: formData.fullName.trim(),
              preview: previewText,
              unread: true,
            },
          ]);

          await supabase.from("email_messages").insert([
            {
              conversation_id: convId,
              from_address: formData.email.trim(),
              to_address: "support@nexiummarkets.com",
              subject: formData.subject,
              body_text: formData.message.trim(),
              direction: "INBOUND",
            },
          ]);
        } catch (dbErr) {
          console.warn("Notice Supabase contact submission:", dbErr);
        }
      }

      // B. Notification immédiate dans le routeur Desk / Chat
      createLiveChatThread({
        visitorName: formData.fullName.trim(),
        contact: formData.email.trim(),
        initialQuery: `[Formulaire Contact] Sujet: ${formData.subject} | MT5: ${formData.mt5Account || "Non spécifié"} | ${formData.message.trim()}`,
        language: language as "fr" | "en",
      }).catch((err) => console.warn("Notice création fil chat:", err));

      // C. Envoi e-mail d'alerte Desk via Resend
      sendContactNotificationEmail({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        subject: formData.subject || "Demande générale",
        message: formData.message.trim(),
        mt5Account: formData.mt5Account.trim() || undefined,
        broker: formData.broker.trim() || undefined,
      }).catch((resendErr) => {
        console.warn("Notice Resend Contact alert:", resendErr);
      });

      // Enregistrer le timestamp pour le rate limiter
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || "[]") as number[];
        localStorage.setItem(storageKey, JSON.stringify([...stored, Date.now()]));
      } catch {
        // Ignorer
      }

      setSubmitted(true);
      toast.success(t.contact.successMsg);
    } catch (err) {
      console.error("Erreur soumission contact:", err);
      toast.error(
        language === "fr"
          ? "Une erreur est survenue lors de l'envoi. Veuillez réessayer."
          : "An error occurred while sending. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      email: "",
      subject: reasons[0],
      mt5Account: "",
      broker: "",
      message: "",
    });
    setSubmitted(false);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow={t.contact.badge}
        title={t.contact.title}
        description={t.contact.subtitle}
      />

      <Section>
        {/* Contact Channels Grid */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {contactChannels.map((c) => (
            <div
              key={c.title}
              className="glass-card-dark rounded-3xl p-6 border border-white/10 hover:border-[#00ff66]/50 transition-all duration-300 shadow-xl group relative overflow-hidden text-center sm:text-left"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.2)] group-hover:scale-110 transition-transform">
                  <c.icon className="size-5" />
                </span>
                <span className="rounded-full bg-[#00ff66]/10 border border-[#00ff66]/30 px-3 py-1 text-[10px] font-black text-[#00ff66] font-mono">
                  {c.badge}
                </span>
              </div>

              <h3 className="mt-4 text-sm font-black text-white group-hover:text-[#00ff66] transition-colors">
                {c.title}
              </h3>
              <p className="mt-1 text-xs text-gray-400 font-medium">
                {c.description}
              </p>
              <p className="mt-3 font-mono text-xs font-black text-white break-all">
                {c.contact}
              </p>
            </div>
          ))}
        </div>

        {/* Centered Light-Background Form Container */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-white text-gray-900 rounded-[32px] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-gray-100 relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#00c853]">
                  {language === "fr" ? "FORMULAIRE DE CONTACT" : "CONTACT FORM"}
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {language === "fr" ? "Envoyer un Message" : "Send a Message"}
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs text-gray-700 font-mono font-bold">
                <Clock className="size-3.5 text-[#00c853]" /> {language === "fr" ? "Réponse < 15 min" : "Response < 15 min"}
              </div>
            </div>

            {submitted ? (
              <div className="py-12 text-center space-y-5">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 border-2 border-[#00c853] text-[#00c853] shadow-lg animate-bounce">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">
                  {language === "fr" ? "Message Transmis avec Succès !" : "Message Sent Successfully!"}
                </h3>
                <p className="max-w-md mx-auto text-sm text-gray-600 leading-relaxed font-medium">
                  {language === "fr"
                    ? `Merci ${formData.fullName}. Notre équipe examine votre demande et vous répondra à ${formData.email} dans les plus brefs délais.`
                    : `Thank you ${formData.fullName}. Our engineering team is reviewing your inquiry and will respond to ${formData.email} shortly.`}
                </p>
                <div className="pt-4">
                  <button
                    onClick={handleReset}
                    className="rounded-2xl bg-gray-900 hover:bg-black text-white px-8 py-3.5 text-xs font-black uppercase tracking-wider cursor-pointer hover:scale-105 transition-all shadow-md"
                  >
                    {language === "fr" ? "Envoyer un autre message" : "Send another message"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* Champ Honeypot invisible pour capturer les robots spammeurs */}
                <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
                  <label htmlFor="website_honeypot">Ne pas remplir</label>
                  <input
                    id="website_honeypot"
                    type="text"
                    name="website_honeypot"
                    tabIndex={-1}
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                {/* Name & Email Row */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                      {t.contact.nameLabel} <span className="text-[#00c853]">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 size-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder={t.contact.namePlaceholder}
                        className="w-full rounded-2xl border border-gray-300 bg-gray-50/70 pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                      {t.contact.emailLabel} <span className="text-[#00c853]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 size-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t.contact.emailPlaceholder}
                        className="w-full rounded-2xl border border-gray-300 bg-gray-50/70 pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                    {t.contact.topicLabel} <span className="text-[#00c853]">*</span>
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-2xl border border-gray-300 bg-gray-50/70 px-4 py-3.5 text-sm text-gray-900 outline-none focus:bg-white focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all cursor-pointer font-medium"
                  >
                    {reasons.map((r) => (
                      <option key={r} value={r} className="bg-white text-gray-900">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* MT5 Account & Broker Row (Optional) */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      {language === "fr" ? "N° Compte MT5" : "MT5 Account Number"}{" "}
                      <span className="text-[10px] lowercase text-gray-400">
                        ({language === "fr" ? "optionnel" : "optional"})
                      </span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-3.5 size-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.mt5Account}
                        onChange={(e) => setFormData({ ...formData, mt5Account: e.target.value })}
                        placeholder="Ex. 802194"
                        className="w-full rounded-2xl border border-gray-300 bg-gray-50/70 pl-11 pr-4 py-3.5 font-mono text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      {language === "fr" ? "Votre Broker" : "Your MT5 Broker"}{" "}
                      <span className="text-[10px] lowercase text-gray-400">
                        ({language === "fr" ? "optionnel" : "optional"})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.broker}
                      onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                      placeholder="Ex. IC Markets, Vantage, Deriv..."
                      className="w-full rounded-2xl border border-gray-300 bg-gray-50/70 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Message Box */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                    {t.contact.messageLabel} <span className="text-[#00c853]">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={t.contact.messagePlaceholder}
                    className="w-full rounded-2xl border border-gray-300 bg-gray-50/70 p-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-[#00c853] focus:ring-2 focus:ring-[#00c853]/20 transition-all resize-none font-medium"
                  />
                </div>

                {/* Submit Row */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="size-4 text-[#00c853]" />{" "}
                    {language === "fr" ? "Données chiffrées & confidentielles" : "Encrypted & strictly confidential"}
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl bg-[#00c853] hover:bg-[#00b047] text-white px-9 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-[#00c853]/30 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        {language === "fr" ? "ENVOI EN COURS..." : "SENDING..."}
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        {t.contact.submitBtn}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
