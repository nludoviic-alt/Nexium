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
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { LanguageSelector } from "@/components/site/LanguageSelector";
import { Button } from "@/components/ui/button";
import {
  renderAdminNewClientAlertEmailHtml,
  renderCustomDeskEmailHtml,
  renderDepositConfirmedEmailHtml,
  renderPasswordResetEmailHtml,
  renderRegistrationPendingEmailHtml,
  renderWelcomeEmailHtml,
  renderWithdrawalApprovedEmailHtml,
} from "@/lib/resend";

export const Route = createFileRoute("/email-preview")({
  head: () => ({
    meta: [
      { title: "Prévisualisation des Templates E-mail — Nexium Markets" },
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
  | "support";

const TEMPLATES: Array<{
  id: TemplateKey;
  label: string;
  badge: string;
  category: "Client" | "Transaction" | "Sécurité" | "Admin";
}> = [
  { id: "registration", label: "Inscription Reçue", badge: "Client", category: "Client" },
  { id: "welcome", label: "Compte Activé / Bienvenue", badge: "Client", category: "Client" },
  { id: "reset-password", label: "Mot de Passe Oublié", badge: "Sécurité", category: "Sécurité" },
  { id: "deposit", label: "Dépôt Confirmé (+2 500 €)", badge: "Fonds", category: "Transaction" },
  { id: "withdrawal", label: "Retrait Validé", badge: "Fonds", category: "Transaction" },
  { id: "admin-alert", label: "Alerte Admin (Nouveau Client)", badge: "Admin", category: "Admin" },
  { id: "support", label: "Message Support / Desk", badge: "Support", category: "Client" },
];

function EmailPreviewPage() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>("registration");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  // Editable sample parameters
  const [clientName, setClientName] = useState("Alexandre Laurent");
  const [clientEmail, setClientEmail] = useState("alexandre.laurent@gmail.com");
  const [amount, setAmount] = useState("2 500,00 EUR");
  const [mt5Login, setMt5Login] = useState("892041");

  const currentHtml = useMemo(() => {
    switch (activeTemplate) {
      case "registration":
        return renderRegistrationPendingEmailHtml(clientName, "France");
      case "welcome":
        return renderWelcomeEmailHtml(clientName, mt5Login);
      case "reset-password":
        return renderPasswordResetEmailHtml(
          clientName,
          "https://nexiummarkets.com/reset-password?token=demo_token_123"
        );
      case "deposit":
        return renderDepositConfirmedEmailHtml(
          clientName,
          amount,
          mt5Login,
          "NEX-849201"
        );
      case "withdrawal":
        return renderWithdrawalApprovedEmailHtml(
          clientName,
          amount,
          "FR76 3000 4012 3456 7890 1234 567"
        );
      case "admin-alert":
        return renderAdminNewClientAlertEmailHtml({
          name: clientName,
          email: clientEmail,
          country: "France",
          phone: "+33 6 12 34 56 78",
          ibCode: "IB-90462",
        });
      case "support":
        return renderCustomDeskEmailHtml(
          "Bonjour Alexandre,\n\nVotre configuration VPS New York NY4 est désormais opérationnelle avec une latence mesurée de 0.8ms.\n\nN'hésitez pas si vous souhaitez ajuster vos paramètres de gestion du risque.",
          "Marc V. — Desk Institutionnel"
        );
      default:
        return "";
    }
  }, [activeTemplate, clientName, clientEmail, amount, mt5Login]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(currentHtml);
    setCopied(true);
    toast.success("Code HTML de l'e-mail copié dans le presse-papier !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#05080e] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#080d15]/95 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-mono text-lg font-black tracking-widest text-white uppercase group-hover:text-[#00D084] transition-colors">
              NEXIUM
            </span>
            <span className="h-3.5 w-px bg-slate-700" />
            <span className="text-[10px] font-black text-[#00D084] uppercase tracking-widest">
              EMAILS
            </span>
          </Link>
          <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#00D084]/10 text-[#00D084] border border-[#00D084]/30">
            Design Épuré Transactionnel
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Device switcher */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => setDeviceMode("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                deviceMode === "desktop"
                  ? "bg-[#00D084] text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Laptop className="size-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                deviceMode === "mobile"
                  ? "bg-[#00D084] text-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="size-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleCopyHtml}
            variant="outline"
            className="border-slate-700 bg-slate-900 text-xs font-bold hover:bg-slate-800 text-white cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-[#00D084]" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline ml-1.5">Copier HTML</span>
          </Button>

          <LanguageSelector variant="compact" />
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 grid lg:grid-cols-12 overflow-hidden">
        {/* Left Sidebar: Template Picker & Parameters */}
        <aside className="lg:col-span-4 xl:col-span-3 border-r border-slate-800 bg-[#070b12] p-4 sm:p-5 flex flex-col justify-between gap-6 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-[#00D084] mb-1">
                Catalogue E-mails
              </div>
              <h2 className="text-sm font-bold text-slate-300">
                Sélectionnez un modèle à visualiser
              </h2>
            </div>

            {/* Template List */}
            <div className="flex flex-col gap-1.5">
              {TEMPLATES.map((tmpl) => {
                const isActive = activeTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setActiveTemplate(tmpl.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#00D084]/15 border border-[#00D084]/50 text-white shadow-[0_0_15px_rgba(0,208,132,0.15)]"
                        : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail
                        className={`size-3.5 ${
                          isActive ? "text-[#00D084]" : "text-slate-500"
                        }`}
                      />
                      <span>{tmpl.label}</span>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isActive
                          ? "bg-[#00D084] text-black font-extrabold"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {tmpl.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Editable Demo Data */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Variables de test
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                    Nom du client
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00D084] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                    Montant test
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00D084] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#00D084]" />
              Format Transactionnel Pur
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Design optimisé pour boîte de réception (Gmail, Apple Mail, Outlook). Fini les longs pavés : les informations clés sont directes et claires.
            </p>
          </div>
        </aside>

        {/* Right Preview Canvas */}
        <main className="lg:col-span-8 xl:col-span-9 bg-[#04060a] p-4 sm:p-8 flex items-center justify-center overflow-auto">
          <div
            className={`transition-all duration-300 ${
              deviceMode === "mobile"
                ? "w-[390px] h-[780px] rounded-[44px] p-4 bg-slate-900 border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col"
                : "w-full max-w-[720px] rounded-2xl bg-transparent"
            }`}
          >
            {deviceMode === "mobile" && (
              <div className="w-full flex items-center justify-between px-4 py-1 mb-2 text-slate-400 text-[10px] font-mono">
                <span>9:41</span>
                <div className="w-16 h-4 bg-black rounded-full mx-auto" />
                <span>5G 100%</span>
              </div>
            )}

            <div
              className={`w-full flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#05080e]`}
            >
              <iframe
                title="Email Preview"
                srcDoc={currentHtml}
                className="w-full h-full min-h-[660px] border-none"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
