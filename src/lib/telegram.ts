/**
 * Service d'alertes instantanées Telegram pour Nexium Markets.
 * Expédie des notifications en temps réel pour :
 * 1. Nouvelles inscriptions clients
 * 2. Formulaire de contact
 * 3. Dossiers de recouvrement
 */

const DEFAULT_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "";

let configuredChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || "";

export function setTelegramChatId(chatId: string) {
  configuredChatId = chatId;
}

export function getTelegramChatId(): string {
  return configuredChatId;
}

/**
 * Envoie un message brut formaté en HTML sur le canal / groupe Telegram
 */
export async function sendTelegramNotification(
  htmlText: string,
  chatId = configuredChatId,
  botToken = DEFAULT_BOT_TOKEN
): Promise<{ success: boolean; error?: string }> {
  if (!botToken) {
    console.warn("[Telegram] Token manquant, notification ignorée.");
    return { success: false, error: "Missing bot token" };
  }

  const targetChatId = chatId || configuredChatId;
  if (!targetChatId) {
    console.info("[Telegram Queue] Chat ID non encore défini, en attente de configuration.");
    return { success: false, error: "Missing chat ID" };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      console.warn("[Telegram Alert Error]", data);
      return { success: false, error: data?.description || `HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("[Telegram Network Error]", err);
    return { success: false, error: err?.message || "Network error" };
  }
}

/**
 * 1. ALERTE NOUVELLE INSCRIPTION CLIENT
 */
export async function notifyTelegramNewRegistration(clientData: {
  name: string;
  email: string;
  country?: string;
  phone?: string;
  ibCode?: string;
}) {
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const msg = [
    `👤 <b>NOUVELLE INSCRIPTION CLIENT</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>Nom :</b> ${escapeHtml(clientData.name)}`,
    `<b>Email :</b> ${escapeHtml(clientData.email)}`,
    clientData.phone ? `<b>Téléphone :</b> ${escapeHtml(clientData.phone)}` : null,
    clientData.country ? `<b>Pays :</b> ${escapeHtml(clientData.country)}` : null,
    clientData.ibCode ? `<b>Code Parrain :</b> ${escapeHtml(clientData.ibCode)}` : null,
    `<b>Date :</b> ${now} (Paris)`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🔗 <a href="https://nexiummarkets.com/desk">Ouvrir la Console Desk</a>`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendTelegramNotification(msg);
}

/**
 * 2. ALERTE NOUVEAU MESSAGE CONTACT
 */
export async function notifyTelegramContactMessage(data: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  mt5Account?: string;
  broker?: string;
}) {
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const msg = [
    `✉️ <b>NOUVEAU MESSAGE CONTACT</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>De :</b> ${escapeHtml(data.fullName)}`,
    `<b>Email :</b> ${escapeHtml(data.email)}`,
    `<b>Objet :</b> ${escapeHtml(data.subject)}`,
    data.mt5Account ? `<b>Compte MT5 :</b> ${escapeHtml(data.mt5Account)}` : null,
    data.broker ? `<b>Courtier :</b> ${escapeHtml(data.broker)}` : null,
    `<b>Date :</b> ${now}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>Message :</b>`,
    `<i>${escapeHtml(data.message.slice(0, 500))}</i>`,
    data.message.length > 500 ? `<i>... [suite tronquée]</i>` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🔗 <a href="https://nexiummarkets.com/desk">Répondre sur le Desk</a>`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendTelegramNotification(msg);
}

/**
 * 3. ALERTE DOSSIER RECOUVREMENT DE FONDS
 */
export async function notifyTelegramRecoveryDossier(data: {
  dossierId: string;
  fullName: string;
  email: string;
  phone: string;
  brokerPlatform?: string;
  estimatedAmount?: string;
  disputeLabel?: string;
  description?: string;
}) {
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const msg = [
    `🚨 <b>NOUVEAU DOSSIER RECOUVREMENT</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>Réf Dossier :</b> <code>${escapeHtml(data.dossierId)}</code>`,
    `<b>Client :</b> ${escapeHtml(data.fullName)}`,
    `<b>Téléphone direct :</b> <b>${escapeHtml(data.phone)}</b>`,
    `<b>Email :</b> ${escapeHtml(data.email)}`,
    data.brokerPlatform ? `<b>Plateforme/Courtier :</b> ${escapeHtml(data.brokerPlatform)}` : null,
    data.estimatedAmount ? `<b>Montant bloqué :</b> 💰 <b>${escapeHtml(data.estimatedAmount)}</b>` : null,
    data.disputeLabel ? `<b>Type de litige :</b> ${escapeHtml(data.disputeLabel)}` : null,
    `<b>Date :</b> ${now}`,
    data.description
      ? `\n<b>Précisions :</b>\n<i>${escapeHtml(data.description.slice(0, 400))}</i>`
      : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `⚡ <i>Engagement : Rappel sous 2h ouvrées</i>`,
    `🔗 <a href="https://nexiummarkets.com/desk">Traiter le dossier sur le Desk</a>`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendTelegramNotification(msg);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
