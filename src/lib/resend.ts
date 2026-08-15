import { Resend } from "resend";

const resendApiKey = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.RESEND_API_KEY || "";
const defaultFromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || "Nexium Markets <onboarding@resend.dev>";

/**
 * Indique si Resend est configuré avec une clé API active.
 */
export const isResendConfigured = Boolean(
  resendApiKey && 
  resendApiKey.startsWith("re_") &&
  !resendApiKey.includes("your-api-key")
);

if (!isResendConfigured && typeof window !== "undefined") {
  console.info(
    "ℹ️ [Nexium Markets] Resend n'est pas encore connecté à une clé API réelle (re_...). " +
    "L'application utilise le mode simulation pour l'envoi d'e-mails. " +
    "Pour activer les envois réels, renseignez VITE_RESEND_API_KEY dans votre fichier .env.local."
  );
}

/**
 * Instance Resend.
 */
export const resend = new Resend(resendApiKey || "re_dummy_key_for_initialization");

/* ==========================================================================
   TEMPLATES HTML OFFICIELS AUX COULEURS DE NEXIUM (OBSIDIENNE & ÉMERAUDE)
   ========================================================================== */

function getEmailWrapper(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0d10; color: #f8fafc; margin: 0; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #12161c; border-radius: 16px; border: 1px solid rgba(0, 208, 132, 0.2); overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
    .header { padding: 32px 32px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, #161c24 0%, #12161c 100%); }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #ffffff; text-transform: uppercase; margin: 0; font-family: monospace; }
    .logo-accent { color: #00D084; }
    .subtitle { font-size: 11px; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; font-weight: 700; }
    .content { padding: 32px; font-size: 15px; line-height: 1.6; color: #e2e8f0; }
    .highlight-card { background: rgba(0, 208, 132, 0.08); border: 1px solid rgba(0, 208, 132, 0.25); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .btn { display: inline-block; background-color: #00D084; color: #021a11; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; margin-top: 16px; }
    .footer { padding: 24px 32px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: #64748b; background-color: #0d1117; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">NEXIUM<span class="logo-accent">.</span></h1>
      <div class="subtitle">Operations &amp; Quantitative Trading</div>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>Nexium Markets Inc. · Centre Financier Institutionnel · Datacentre Equinix NY4</p>
      <p style="margin-top: 6px; font-size: 11px;">Ce message est strictement confidentiel et destiné à l'investisseur titulaire du compte.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/* ==========================================================================
   MÉTHODES D'ENVOI TRANSACTIONNELLES TYPESAFE
   ========================================================================== */

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Envoie un e-mail de bienvenue à l'investisseur avec confirmation de son compte.
 */
export async function sendWelcomeEmail(to: string, clientName: string, mt5Login?: string): Promise<SendEmailResult> {
  const html = getEmailWrapper(
    "Bienvenue chez Nexium Markets",
    `
      <h2 style="color: #ffffff; margin-top: 0;">Bienvenue, ${clientName}</h2>
      <p>Votre compte d'accès institutionnel Nexium Markets a été créé avec succès.</p>
      
      <div class="highlight-card">
        <strong style="color: #00D084; font-size: 13px; text-transform: uppercase; font-family: monospace;">Identifiants MT5 ECN Direct</strong>
        <p style="margin: 8px 0 4px; font-family: monospace; font-size: 15px; color: #ffffff;">
          Serveur : <strong>Nexium-Live-NY4</strong><br/>
          Login : <strong>#${mt5Login || "Attribution en cours"}</strong><br/>
          Passerelle : <strong>Pont Fibre Optique FIX 11ms</strong>
        </p>
      </div>

      <p>Vous pouvez dès à présent configurer vos stratégies de trading algorithmique et effectuer votre dépôt d'activation.</p>
      <a href="https://nexiummarkets.com/login" class="btn">Accéder à votre Espace Investisseur</a>
    `
  );

  if (!isResendConfigured) {
    console.info(`[Resend Simulé] E-mail de bienvenue pour ${to} (${clientName})`);
    return { success: true, simulated: true, messageId: `sim_${Date.now()}` };
  }

  try {
    const res = await resend.emails.send({
      from: defaultFromEmail,
      to,
      subject: "Bienvenue sur votre compte institutionnel Nexium Markets",
      html,
    });
    return { success: true, messageId: res.data?.id };
  } catch (err: any) {
    console.error("Erreur envoi Resend:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Envoie une confirmation de dépôt validé.
 */
export async function sendDepositConfirmedEmail(to: string, clientName: string, amountFormatted: string, mt5Login: string): Promise<SendEmailResult> {
  const html = getEmailWrapper(
    "Dépôt Confirmé - Nexium Markets",
    `
      <h2 style="color: #ffffff; margin-top: 0;">Confirmation de Dépôt</h2>
      <p>Bonjour ${clientName},</p>
      <p>Nous vous confirmons la bonne réception de vos fonds et le crédit immédiat sur votre compte de trading.</p>

      <div class="highlight-card">
        <p style="margin: 0; font-family: monospace; font-size: 18px; color: #00D084; font-weight: bold;">
          +${amountFormatted}
        </p>
        <p style="margin: 6px 0 0; font-size: 13px; color: #94a3b8; font-family: monospace;">
          Compte MT5 : #${mt5Login} · Solde disponible instantanément
        </p>
      </div>

      <p>Les algorithmes alloués à votre portefeuille sont prêts à exécuter les signaux sur les sessions de marché actives.</p>
      <a href="https://nexiummarkets.com/NEXIUM" class="btn">Consulter votre Solde en Direct</a>
    `
  );

  if (!isResendConfigured) {
    console.info(`[Resend Simulé] E-mail de confirmation de dépôt pour ${to}: ${amountFormatted}`);
    return { success: true, simulated: true, messageId: `sim_${Date.now()}` };
  }

  try {
    const res = await resend.emails.send({
      from: defaultFromEmail,
      to,
      subject: `Dépôt confirmé : +${amountFormatted} crédités sur votre compte MT5 #${mt5Login}`,
      html,
    });
    return { success: true, messageId: res.data?.id };
  } catch (err: any) {
    console.error("Erreur envoi Resend:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Envoie un e-mail personnalisé depuis le Desk Admin.
 */
export async function sendCustomDeskEmail(to: string, subject: string, bodyText: string): Promise<SendEmailResult> {
  const html = getEmailWrapper(
    subject,
    `
      <div style="white-space: pre-wrap; font-size: 15px; line-height: 1.6;">${bodyText}</div>
    `
  );

  if (!isResendConfigured) {
    console.info(`[Resend Simulé] E-mail officiel envoyé à ${to} avec le sujet "${subject}"`);
    return { success: true, simulated: true, messageId: `sim_${Date.now()}` };
  }

  try {
    const res = await resend.emails.send({
      from: defaultFromEmail,
      to,
      subject,
      html,
    });
    return { success: true, messageId: res.data?.id };
  } catch (err: any) {
    console.error("Erreur envoi Resend:", err);
    return { success: false, error: err.message };
  }
}
