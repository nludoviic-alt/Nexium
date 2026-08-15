import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Copy,
  ExternalLink,
  Laptop,
  Mail,
  RefreshCw,
  Send,
  Smartphone,
  Globe,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { LanguageSelector } from "@/components/site/LanguageSelector";
import { Button } from "@/components/ui/button";
import {
  renderAdminNewClientAlertEmailHtml,
  renderContactNotificationHtml,
  renderCustomDeskEmailHtml,
  renderDepositConfirmedEmailHtml,
  renderPasswordResetEmailHtml,
  renderRegistrationPendingEmailHtml,
  renderWelcomeEmailHtml,
  renderWithdrawalApprovedEmailHtml,
  sendViaResendHttp,
  isResendConfigured,
} from "@/lib/resend";

export const Route = createFileRoute("/email-preview")({
  head: () => ({
    meta: [
      { title: "Studio E-mails Resend 680px — Nexium Markets" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmailPreviewPage,
});

type TemplateKey =
  | "registration"
  | "welcome"
  | "reset-password"
  | "deposit"
  | "withdrawal"
  | "admin-alert"
  | "contact-alert"
  | "support";

const TEMPLATES: Array<{
  id: TemplateKey;
  label: string;
  badge: string;
  category: "Client" | "Transaction" | "Sécurité" | "Desk & Admin";
}> = [
  { id: "registration", label: "1. Inscription Reçue", badge: "Client", category: "Client" },
  { id: "welcome", label: "2. Compte Activé / Bienvenue", badge: "Client", category: "Client" },
  { id: "reset-password", label: "3. Mot de Passe Oublié", badge: "Sécurité", category: "Sécurité" },
  { id: "deposit", label: "4. Dépôt Confirmé (+2 500 €)", badge: "Fonds", category: "Transaction" },
  { id: "withdrawal", label: "5. Retrait Validé", badge: "Fonds", category: "Transaction" },
  { id: "admin-alert", label: "6. Alerte Desk (Nouveau Client)", badge: "Desk", category: "Desk & Admin" },
  { id: "contact-alert", label: "7. Alerte Contact Formulaire", badge: "Desk", category: "Desk & Admin" },
  { id: "support", label: "8. Message Conseiller Desk", badge: "Desk", category: "Client" },
];

function EmailPreviewPage() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>("registration");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [emailLang, setEmailLang] = useState<"fr" | "en">("fr");
  const [copied, setCopied] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testRecipient, setTestRecipient] = useState("support@nexiummarkets.com");

  // Editable sample parameters
  const [clientName, setClientName] = useState("Alexandre Laurent");
  const [clientEmail, setClientEmail] = useState("alexandre.laurent@gmail.com");
  const [amount, setAmount] = useState("2 500,00 EUR");
  const [mt5Login, setMt5Login] = useState("892041");

  const currentSubject = useMemo(() => {
    switch (activeTemplate) {
      case "registration":
        return emailLang === "fr"
          ? "⏳ Prise en compte de votre demande d'ouverture — Nexium Markets"
          : "⏳ Account Application Received — Nexium Markets";
      case "welcome":
        return emailLang === "fr"
          ? "👑 Bienvenue chez Nexium Markets — Votre Compte est Activé"
          : "👑 Welcome to Nexium Markets — Your Account is Ready";
      case "reset-password":
        return emailLang === "fr"
          ? "🔒 Réinitialisation de votre mot de passe — Nexium Markets"
          : "🔒 Password Reset Request — Nexium Markets";
      case "deposit":
        return emailLang === "fr"
          ? `✅ Dépôt confirmé : +${amount} sur votre compte #${mt5Login}`
          : `✅ Deposit Confirmed: +${amount} on account #${mt5Login}`;
      case "withdrawal":
        return emailLang === "fr"
          ? `💸 Retrait validé : ${amount}`
          : `💸 Withdrawal Processed: ${amount}`;
      case "admin-alert":
        return `🚨 [DESK] Nouveau client à valider : ${clientName}`;
      case "contact-alert":
        return `📨 [CONTACT DESK] Demande d'informations — ${clientName}`;
      case "support":
        return emailLang === "fr"
          ? "💬 Nexium Markets — Message officiel de votre Desk"
          : "💬 Nexium Markets — Official Desk Advisor Message";
      default:
        return "Nexium Markets — Notification Officielle";
    }
  }, [activeTemplate, emailLang, amount, mt5Login, clientName]);

  const currentHtml = useMemo(() => {
    switch (activeTemplate) {
      case "registration":
        return renderRegistrationPendingEmailHtml(clientName, "France", emailLang);
      case "welcome":
        return renderWelcomeEmailHtml(clientName, mt5Login, emailLang);
      case "reset-password":
        return renderPasswordResetEmailHtml(
          clientName,
          "https://nexiummarkets.com/reset-password?token=demo_token_123",
          emailLang
        );
      case "deposit":
        return renderDepositConfirmedEmailHtml(
          clientName,
          amount,
          mt5Login,
          "NEX-849201",
          emailLang
        );
      case "withdrawal":
        return renderWithdrawalApprovedEmailHtml(
          clientName,
          amount,
          "FR76 3000 4012 3456 7890 1234 567",
          emailLang
        );
      case "admin-alert":
        return renderAdminNewClientAlertEmailHtml({
          name: clientName,
          email: clientEmail,
          country: "France",
          phone: "+33 6 12 34 56 78",
          ibCode: "IB-PARIS-09",
        });
      case "contact-alert":
        return renderContactNotificationHtml({
          fullName: clientName,
          email: clientEmail,
          subject: "Demande d'informations sur l'EA Gold Momentum",
          message: "Bonjour, je souhaite connecter 3 comptes MT5 sous licence Pro. Pouvez-vous me confirmer le temps de latence vers vos serveurs NY4 ?",
          mt5Account: mt5Login,
          broker: "IC Markets ECN",
        });
      case "support":
        return renderCustomDeskEmailHtml(
          "Nous vous confirmons l'allocation du Preset institutionnel AI Gold sur votre compte MT5 #892041. Vos garde-fous de risque ont été validés.",
          "Marc V. — Desk Institutionnel",
          emailLang
        );
      default:
        return "";
    }
  }, [activeTemplate, clientName, clientEmail, amount, mt5Login, emailLang]);

  const copyHtml = () => {
    navigator.clipboard.writeText(currentHtml);
    setCopied(true);
    toast.success("Code HTML complet copié dans le presse-papiers !");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendLiveTest = async () => {
    if (!testRecipient || !testRecipient.includes("@")) {
      toast.error("Veuillez saisir une adresse e-mail de destination valide.");
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await sendViaResendHttp(testRecipient.trim(), currentSubject, currentHtml);
      if (res.success) {
        toast.success(`E-mail de test réel expédié avec succès à ${testRecipient} via Resend !`);
      } else {
        toast.error(`Erreur Resend : ${res.error || "Échec d'envoi"}`);
      }
    } catch (err: any) {
      toast.error(`Erreur réseau : ${err.message || "Inconnue"}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-[#0c121d] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-[0.2em] font-mono">
              NEXIUM<span className="text-[#00c853]">.</span>MARKETS
            </span>
          </Link>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ★ STUDIO RESEND TEMPLATES 680px
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle for Template */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-700/80 p-1">
            <button
              onClick={() => setEmailLang("fr")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                emailLang === "fr"
                  ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              FR (Français)
            </button>
            <button
              onClick={() => setEmailLang("en")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                emailLang === "en"
                  ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              EN (English)
            </button>
          </div>

          {/* Device Toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-700/80 p-1">
            <button
              onClick={() => setDeviceMode("desktop")}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                deviceMode === "desktop"
                  ? "bg-white/10 text-emerald-400"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Vue Desktop (680px)"
            >
              <Laptop className="size-4" />
              <span className="text-xs">Desktop</span>
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                deviceMode === "mobile"
                  ? "bg-white/10 text-emerald-400"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Vue Mobile (380px)"
            >
              <Smartphone className="size-4" />
              <span className="text-xs">Mobile</span>
            </button>
          </div>

          <Button
            onClick={copyHtml}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl gap-2 border border-slate-700"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copié !" : "Copier le HTML"}
          </Button>

          <Link
            to="/desk"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Retour Desk
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-800 bg-[#090e17] p-5 space-y-6 overflow-y-auto">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Templates Officiels Resend ({TEMPLATES.length})
            </h3>
            <div className="space-y-1.5">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setActiveTemplate(tmpl.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    activeTemplate === tmpl.id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm"
                      : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <span>{tmpl.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                    {tmpl.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Envoi de Test Réel via Resend API */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Send className="size-3.5" />
                <span>Test Réel via Resend</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">API Live</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400">Envoyer à l'adresse e-mail :</label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="votre-email@exemple.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none font-mono"
              />

              <Button
                onClick={handleSendLiveTest}
                disabled={isSendingTest}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl gap-2 shadow-lg shadow-emerald-500/20 py-2.5"
              >
                {isSendingTest ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {isSendingTest ? "Expédition en cours…" : "Envoyer ce Template en Réel ➔"}
              </Button>
            </div>
          </div>

          {/* Live Parameter Editor */}
          <div className="border-t border-slate-800 pt-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Paramètres Variables
            </h3>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Nom du client</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Email client</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Compte MT5</label>
              <input
                type="text"
                value={mt5Login}
                onChange={(e) => setMt5Login(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Montant transaction</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
              />
            </div>
          </div>
        </aside>

        {/* Live Preview Area */}
        <main className="flex-1 bg-[#141b26] p-6 flex flex-col items-center justify-start overflow-y-auto">
          <div className="text-center mb-4">
            <span className="text-xs text-slate-400 font-mono">
              Rendu en direct · Format Carte 680px · Midnight Blue #0B1623 & Emeraude #00C98D
            </span>
          </div>

          <div
            className={`transition-all duration-300 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-white ${
              deviceMode === "mobile" ? "w-[380px]" : "w-[680px]"
            }`}
          >
            <iframe
              srcDoc={currentHtml}
              title="Email Preview"
              className="w-full min-h-[920px] border-0"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
