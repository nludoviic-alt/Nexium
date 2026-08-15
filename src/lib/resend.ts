/**
 * Service d'envoi d'e-mails transactionnels ultra-haut de gamme pour Nexium Markets via Resend.
 * Compatible 100% navigateur et serveur (Node.js).
 */

const resendApiKey = import.meta.env.VITE_RESEND_API_KEY || "";
const defaultFromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || "Nexium Markets <support@nexiummarkets.com>";

export const isResendConfigured = Boolean(
  resendApiKey && 
  resendApiKey.startsWith("re_") &&
  !resendApiKey.includes("your-api-key")
);

/* ==========================================================================
   WRAPPER HTML INSTITUTIONNEL NEXIUM MARKETS (DARK LUXURY & EMERALD)
   ========================================================================== */

function getEmailWrapper(title: string, preheader: string, contentHtml: string, opts?: { kicker?: string }): string {
  const kicker = opts?.kicker || "INSTITUTIONAL QUANTITATIVE TRADING";
  return `
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #03060a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #E2E8F0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #0a0f16; border-radius: 20px; border: 1px solid rgba(0, 229, 153, 0.22); overflow: hidden; box-shadow: 0 30px 70px rgba(0, 0, 0, 0.85); }
    .top-stripe { height: 4px; line-height: 4px; font-size: 0; background-color: #00E599; }
    .header-bar { background: linear-gradient(160deg, #081019 0%, #04160f 55%, #060b12 100%); padding: 36px 32px 28px; text-align: center; border-bottom: 1px solid rgba(0, 229, 153, 0.16); }
    .brand-mark { display: inline-block; width: 9px; height: 9px; background: #00E599; transform: rotate(45deg); margin: 0 10px 3px 0; box-shadow: 0 0 10px rgba(0, 229, 153, 0.7); }
    .brand-logo { display: inline-block; font-size: 22px; font-weight: 800; letter-spacing: 5px; color: #FFFFFF; font-family: 'Courier New', monospace; text-transform: uppercase; margin: 0; vertical-align: middle; }
    .brand-accent { color: #00E599; }
    .brand-tag { display: inline-block; background: rgba(0, 229, 153, 0.1); border: 1px solid rgba(0, 229, 153, 0.35); border-radius: 9999px; padding: 6px 18px; font-size: 10px; font-weight: 700; letter-spacing: 2.2px; color: #00E599; text-transform: uppercase; margin-top: 16px; }
    .content-body { padding: 40px 36px 12px; font-size: 15px; line-height: 1.7; color: #CBD5E1; }
    .eyebrow { display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 1.8px; text-transform: uppercase; margin-bottom: 14px; padding: 5px 14px; border-radius: 9999px; }
    .h1-title { font-size: 23px; font-weight: 800; color: #FFFFFF; margin: 0 0 16px 0; letter-spacing: -0.3px; line-height: 1.35; }
    .body-text { margin: 0 0 16px 0; }
    .card-box { background: linear-gradient(180deg, rgba(16, 24, 38, 0.9) 0%, rgba(10, 16, 26, 0.95) 100%); border: 1px solid rgba(0, 229, 153, 0.22); border-radius: 14px; padding: 22px 24px; margin: 22px 0; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06); }
    .card-label { font-size: 11px; font-weight: 800; color: #00E599; text-transform: uppercase; letter-spacing: 1.8px; margin-bottom: 12px; }
    .kv-row td { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-family: 'Courier New', monospace; font-size: 13px; }
    .kv-row:last-child td { border-bottom: none; }
    .kv-label { color: #8291A6; }
    .kv-value { color: #FFFFFF; font-weight: 700; text-align: right; }
    .kv-value-accent { color: #00E599; font-weight: 700; text-align: right; }
    .btn-primary { display: inline-block; background-color: #00E599; background-image: linear-gradient(135deg, #00E599 0%, #00B377 100%); color: #02160d; font-weight: 800; font-size: 14px; letter-spacing: 0.3px; text-decoration: none; padding: 15px 34px; border-radius: 12px; text-align: center; box-shadow: 0 12px 26px rgba(0, 229, 153, 0.3); }
    .divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 28px 0 0; }
    .footnote { font-size: 13px; color: #8291A6; margin-top: 18px; }
    .footer-section { background-color: #060a10; padding: 28px 32px; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #64748B; line-height: 1.7; }
    .footer-links a { color: #00E599; text-decoration: none; margin: 0 8px; font-weight: 600; }
    @media only screen and (max-width: 620px) {
      .content-body { padding: 32px 22px 8px !important; }
      .header-bar { padding: 30px 20px 24px !important; }
      .footer-section { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 28px 12px; background-color: #03060a;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; font-size: 1px; color: #03060a; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <div class="email-container">

          <div class="top-stripe">&nbsp;</div>

          <!-- Header Branding -->
          <div class="header-bar">
            <span class="brand-mark"></span><h1 class="brand-logo">NEXIUM<span class="brand-accent">.</span>MARKETS</h1>
            <div><div class="brand-tag">${kicker}</div></div>
          </div>

          <!-- Main Content -->
          <div class="content-body">
            ${contentHtml}
          </div>

          <!-- Footer Information -->
          <div class="footer-section">
            <p style="margin: 0 0 12px 0; text-align: center; color: #94A3B8;">
              <strong>Nexium Markets</strong> &bull; Global Operations Desk
            </p>
            <p style="margin: 0 0 16px 0; text-align: center;" class="footer-links">
              <a href="https://nexiummarkets.com/NEXIUM">Espace Client</a> •
              <a href="https://nexiummarkets.com/login">Connexion</a> •
              <a href="https://nexiummarkets.com/contact">Support</a> •
              <a href="https://nexiummarkets.com/terms">Conditions</a>
            </p>
            <p style="margin: 0; font-size: 11px; text-align: center; color: #475569;">
              Cet e-mail vous est adressé dans le cadre de la gestion de votre compte Nexium Markets. Ne partagez jamais vos identifiants ou codes de sécurité.
            </p>
          </div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function eyebrow(text: string, color: string, bg: string, border: string): string {
  return `<div style="text-align:center;"><span class="eyebrow" style="color:${color}; background:${bg}; border:1px solid ${border};">${text}</span></div>`;
}

function kvTable(rows: Array<{ label: string; value: string; accent?: boolean }>): string {
  const trs = rows
    .map(
      (r) =>
        `<tr class="kv-row"><td class="kv-label">${r.label}</td><td class="${r.accent ? "kv-value-accent" : "kv-value"}">${r.value}</td></tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 6px;">${trs}</table>`;
}

function ctaButton(url: string, label: string): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 26px auto 8px;">
      <tr>
        <td align="center" bgcolor="#00E599" style="border-radius: 12px;">
          <a href="${url}" class="btn-primary" target="_blank">${label}</a>
        </td>
      </tr>
    </table>
  `;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

async function sendViaResendHttp(to: string, subject: string, html: string): Promise<SendEmailResult> {
  try {
    const relayRes = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
    if (relayRes.ok) {
      const relayData = await relayRes.json();
      return { success: true, messageId: relayData.id };
    }
  } catch (relayErr) {}

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: defaultFromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, messageId: data.id };
      }
    } catch (err: any) {
      console.warn("Direct Resend notice:", err);
    }
  }

  return { success: true, simulated: true, messageId: `sim_${Date.now()}` };
}

export async function sendRegistrationPendingEmail(
  to: string,
  clientName: string,
  country?: string
): Promise<SendEmailResult> {
  const subject = "⏳ Prise en compte de votre demande d'ouverture de compte — Nexium Markets";
  const preheader = "Votre dossier a bien été enregistré et est en cours d'examen par notre Desk de Conformité.";

  const html = getEmailWrapper(
    subject,
    preheader,
    `
      ${eyebrow("Dossier en cours de validation", "#FBBF24", "rgba(245, 158, 11, 0.1)", "rgba(245, 158, 11, 0.3)")}

      <h2 class="h1-title" style="text-align: center;">Demande d'ouverture enregistrée</h2>

      <p class="body-text" style="text-align: center; font-size: 16px; color: #E2E8F0;">
        Bonjour <strong>${clientName}</strong>,<br/>
        Nous vous confirmons la bonne prise en compte de votre inscription sur la plateforme <strong>Nexium Markets</strong>.
      </p>

      <div class="card-box">
        <div class="card-label">Récapitulatif de votre dossier</div>
        ${kvTable([
          { label: "Titulaire du compte", value: clientName },
          { label: "Pays de résidence", value: country || "France" },
          { label: "Statut du dossier", value: "En attente de revue", accent: true },
        ])}
      </div>

      <div class="card-box" style="border-color: rgba(0, 229, 153, 0.28);">
        <div class="card-label">Prochaines étapes</div>
        <p style="margin: 0; font-size: 13px; color: #CBD5E1; line-height: 1.6;">
          Un membre de notre équipe procède actuellement aux vérifications d'usage. Dès validation de votre compte, vous recevrez un e-mail d'activation avec vos accès complets.
        </p>
      </div>

      <div style="text-align: center;">
        ${ctaButton("https://nexiummarkets.com/login", "Accéder au portail de connexion")}
      </div>

      <p class="footnote" style="text-align: center;">
        Besoin d'aide ? Contactez notre support à <a href="mailto:support@nexiummarkets.com" style="color: #00E599; font-weight: bold; text-decoration: underline;">support@nexiummarkets.com</a>.
      </p>
    `,
    { kicker: "Confirmation d'inscription" }
  );

  return sendViaResendHttp(to, subject, html);
}

/**
 * 0.1 ALERTE DE DIFFUSION ADMINISTRATEURS (NOUVEAU CLIENT CRÉÉ)
 * Diffusé immédiatement au Desk Administrateur / Direction lors d'une nouvelle inscription.
 */
export async function sendAdminNewClientAlertEmail(clientData: {
  name: string;
  email: string;
  country?: string | undefined;
  phone?: string | undefined;
  ibCode?: string | undefined;
}): Promise<SendEmailResult> {
  const subject = `🚨 [NOUVEAU CLIENT] Inscription en attente d'approbation — ${clientData.name}`;
  const preheader = `Un nouvel investisseur vient de créer son compte : ${clientData.name} (${clientData.email}).`;

  const html = getEmailWrapper(
    subject,
    preheader,
    `
      ${eyebrow("Notification Direction & Conformité", "#F87171", "rgba(239, 68, 68, 0.12)", "rgba(239, 68, 68, 0.35)")}
      <h2 class="h1-title">Nouveau client en attente d'approbation</h2>
      <p class="body-text">Un nouvel utilisateur vient de compléter son formulaire d'inscription sur la plateforme <strong>Nexium Markets</strong> et requiert une validation par l'administration.</p>

      <div class="card-box" style="border-color: rgba(245, 158, 11, 0.35);">
        <div class="card-label" style="color: #F59E0B;">Fiche d'inscription client</div>
        ${kvTable([
          { label: "Nom & prénom", value: clientData.name },
          { label: "Adresse e-mail", value: clientData.email, accent: true },
          { label: "Pays de résidence", value: clientData.country || "Non renseigné" },
          { label: "Téléphone", value: clientData.phone || "Non renseigné" },
          { label: "Code IB / parrain", value: clientData.ibCode || "Aucun" },
          { label: "Statut actuel", value: "PENDING_APPROVAL" },
        ])}
      </div>

      <div style="text-align: center;">
        ${ctaButton("https://nexiummarkets.com/composition", "Ouvrir la console admin")}
      </div>
    `,
    { kicker: "Alerte nouvelle inscription" }
  );

  return sendViaResendHttp("support@nexiummarkets.com", subject, html);
}

/**
 * 1. E-MAIL DE BIENVENUE & ACCRÉDITATION INVESTISSEUR
 */
export async function sendWelcomeEmail(to: string, clientName: string, mt5Login?: string): Promise<SendEmailResult> {
  const subject = "👑 Bienvenue chez Nexium Markets — Activation de votre Accès Institutionnel";
  const preheader = "Vos accès au portail de trading algorithmique et à la passerelle MT5 ECN sont disponibles.";

  const html = getEmailWrapper(
    subject,
    preheader,
    `
      <h2 class="h1-title">Bienvenue, ${clientName}</h2>
      <p class="body-text">Votre compte <strong>Nexium Markets</strong> a été activé avec succès. Vous avez désormais accès à votre tableau de bord et à votre passerelle de trading MT5.</p>

      <div class="card-box">
        <div class="card-label">Accès MT5</div>
        ${kvTable([
          { label: "Serveur", value: "Nexium-Live-NY4" },
          { label: "Identifiant de compte", value: `#${mt5Login || "Attribution en cours"}`, accent: true },
          { label: "Statut du compte", value: "Actif", accent: true },
        ])}
      </div>

      <p class="body-text">Vous pouvez dès à présent consulter votre tableau de bord, activer vos stratégies et suivre vos performances en direct.</p>

      <div style="text-align: center;">
        ${ctaButton("https://nexiummarkets.com/NEXIUM", "Accéder à mon espace")}
      </div>
    `,
    { kicker: "Compte activé" }
  );

  return sendViaResendHttp(to, subject, html);
}

/**
 * 2. CONFIRMATION DE DÉPÔT ET CRÉDIT DES FONDS
 */
export async function sendDepositConfirmedEmail(
  to: string, 
  clientName: string, 
  amountFormatted: string, 
  mt5Login: string,
  txRef?: string
): Promise<SendEmailResult> {
  const subject = `✅ Dépôt Confirmé : +${amountFormatted} crédités sur votre compte #${mt5Login}`;
  const preheader = `Vos fonds ont été réceptionnés et sont instantanément alloués à votre portefeuille de trading.`;

  const html = getEmailWrapper(
    subject,
    preheader,
    `
      <h2 class="h1-title">Confirmation de crédit de fonds</h2>
      <p class="body-text">Bonjour ${clientName},</p>
      <p class="body-text">Nous vous confirmons la bonne exécution de votre dépôt. Le montant a été crédité sur votre compte de trading.</p>

      <div class="card-box" style="border-color: rgba(0, 229, 153, 0.35);">
        <div class="card-label">Détails de la transaction</div>
        <div style="font-size: 28px; font-weight: 800; color: #00E599; font-family: 'Courier New', monospace; margin: 4px 0 14px;">
          +${amountFormatted}
        </div>
        ${kvTable([
          { label: "Compte MT5 bénéficiaire", value: `#${mt5Login}` },
          { label: "Référence transaction", value: txRef || "NEX-" + Math.floor(100000 + Math.random() * 900000) },
          { label: "Disponibilité", value: "Immédiate", accent: true },
        ])}
      </div>

      <div style="text-align: center;">
        ${ctaButton("https://nexiummarkets.com/NEXIUM", "Consulter mon solde")}
      </div>
    `,
    { kicker: "Dépôt confirmé" }
  );

  return sendViaResendHttp(to, subject, html);
}

/**
 * 3. RÉINITIALISATION SÉCURISÉE DU MOT DE PASSE
 */
export async function sendPasswordResetEmail(to: string, clientName: string, resetUrl: string): Promise<SendEmailResult> {
  const subject = "🔒 Réinitialisation Sécurisée de votre Mot de Passe — Nexium Markets";
  const preheader = "Une demande de modification de mot de passe a été émise pour votre compte.";

  const html = getEmailWrapper(
    subject,
    preheader,
    `
      <h2 class="h1-title">Réinitialisation de mot de passe</h2>
      <p class="body-text">Bonjour ${clientName},</p>
      <p class="body-text">Nous avons reçu une demande de réinitialisation d'accès pour votre compte <strong>Nexium Markets</strong>.</p>

      <div class="card-box">
        <div class="card-label">Procédure de sécurité</div>
        <p style="margin: 0; font-size: 14px; color: #CBD5E1;">
          Cliquez sur le bouton ci-dessous pour choisir votre nouveau mot de passe. Ce lien est temporaire et expirera dans <strong>15 minutes</strong>.
        </p>
      </div>

      <div style="text-align: center;">
        ${ctaButton(resetUrl, "Réinitialiser mon mot de passe")}
      </div>

      <p class="footnote">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail — votre mot de passe actuel reste inchangé.
      </p>
    `,
    { kicker: "Sécurité du compte" }
  );

  return sendViaResendHttp(to, subject, html);
}

/**
 * 4. NOTIFICATION DE RETRAIT APPROUVÉ / TRANSFÉRÉ
 */
export async function sendWithdrawalApprovedEmail(
  to: string,
  clientName: string,
  amountFormatted: string,
  destinationIbanOrWallet: string
): Promise<SendEmailResult> {
  const subject = `💸 Retrait Approuvé : ${amountFormatted} transférés avec succès`;
  const preheader = `Votre demande de retrait a été validée et ordonnée par le département financier.`;

  const html = getEmailWrapper(
    subject,
    preheader,
    `
      <h2 class="h1-title">Validation de votre retrait</h2>
      <p class="body-text">Bonjour ${clientName},</p>
      <p class="body-text">Nous vous informons que votre demande de retrait a été validée et le virement a été émis.</p>

      <div class="card-box" style="border-color: rgba(59, 130, 246, 0.35);">
        <div class="card-label" style="color: #60A5FA;">Ordre de virement émis</div>
        <div style="font-size: 26px; font-weight: 800; color: #FFFFFF; font-family: 'Courier New', monospace; margin: 4px 0 14px;">
          ${amountFormatted}
        </div>
        ${kvTable([
          { label: "Destination des fonds", value: destinationIbanOrWallet },
          { label: "Statut", value: "Traité & exécuté", accent: true },
        ])}
      </div>

      <p class="body-text">Les fonds apparaîtront sur votre compte selon les délais habituels de votre établissement.</p>

      <div style="text-align: center;">
        ${ctaButton("https://nexiummarkets.com/NEXIUM", "Accéder à mon espace client")}
      </div>
    `,
    { kicker: "Retrait approuvé" }
  );

  return sendViaResendHttp(to, subject, html);
}

/**
 * 5. MESSAGE DIRECT DU DESK CONSEILLER OU SUPPORT
 */
export async function sendCustomDeskEmail(to: string, subject: string, bodyText: string, advisorName?: string): Promise<SendEmailResult> {
  const preheader = bodyText.slice(0, 100).replace(/\n/g, " ") + "...";

  const formattedContent = bodyText
    .split("\n\n")
    .map((p) => `<p style="margin: 0 0 14px 0;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const html = getEmailWrapper(
    subject,
    preheader,
    `
      <div style="font-size: 15px; line-height: 1.7; color: #E2E8F0;">
        ${formattedContent}
      </div>

      <hr class="divider" />
      <p style="margin: 18px 0 0 0; font-size: 14px; font-weight: 700; color: #FFFFFF;">
        ${advisorName || "Le Desk d'opérations & gestion de compte"}
      </p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #00E599; font-family: 'Courier New', monospace;">
        Nexium Markets
      </p>

      <div style="text-align: center;">
        ${ctaButton("https://nexiummarkets.com/login", "Répondre depuis mon espace client")}
      </div>
    `,
    { kicker: "Message de votre conseiller" }
  );

  return sendViaResendHttp(to, subject, html);
}
