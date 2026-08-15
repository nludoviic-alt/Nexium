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

function getEmailWrapper(title: string, preheader: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
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
    .email-container { max-width: 600px; margin: 0 auto; background-color: #080d16; border-radius: 24px; border: 1px solid rgba(0, 229, 153, 0.28); overflow: hidden; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9); }
    .header-bar { background: linear-gradient(135deg, #07101c 0%, #031c12 50%, #060c14 100%); padding: 40px 32px 32px; text-align: center; border-bottom: 1px solid rgba(0, 229, 153, 0.2); position: relative; }
    .brand-logo { font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #FFFFFF; font-family: 'Courier New', monospace; text-transform: uppercase; margin: 0; }
    .brand-accent { color: #00E599; }
    .brand-tag { display: inline-block; background: rgba(0, 229, 153, 0.12); border: 1px solid rgba(0, 229, 153, 0.4); border-radius: 9999px; padding: 5px 16px; font-size: 10px; font-weight: 800; letter-spacing: 2.5px; color: #00E599; text-transform: uppercase; margin-top: 12px; }
    .content-body { padding: 38px 34px; font-size: 15px; line-height: 1.7; color: #CBD5E1; }
    .h1-title { font-size: 24px; font-weight: 900; color: #FFFFFF; margin: 0 0 16px 0; letter-spacing: -0.5px; line-height: 1.3; }
    .card-box { background: linear-gradient(180deg, rgba(14, 22, 36, 0.9) 0%, rgba(10, 16, 26, 0.95) 100%); border: 1px solid rgba(0, 229, 153, 0.28); border-radius: 16px; padding: 24px; margin: 24px 0; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08); }
    .card-label { font-size: 11px; font-weight: 800; color: #00E599; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
    .btn-primary { display: inline-block; background: linear-gradient(135deg, #00E599 0%, #00B377 100%); color: #02160d !important; font-weight: 900; font-size: 14px; letter-spacing: 0.5px; text-decoration: none; padding: 15px 36px; border-radius: 14px; text-align: center; box-shadow: 0 10px 25px rgba(0, 229, 153, 0.35); margin: 24px 0 12px; }
    .security-badge { display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px; font-size: 11px; color: #94A3B8; margin-top: 28px; font-family: monospace; }
    .footer-section { background-color: #04070d; padding: 30px 32px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: #64748B; line-height: 1.6; }
    .footer-links a { color: #00E599; text-decoration: none; margin: 0 10px; font-weight: 600; }
  </style>
</head>
<body style="margin: 0; padding: 32px 12px; background-color: #03060a;">
  <!-- Preheader text for inbox preview -->
  <div style="display: none; font-size: 1px; color: #03060a; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <div class="email-container">
          
          <!-- Header Branding -->
          <div class="header-bar">
            <h1 class="brand-logo">NEXIUM<span class="brand-accent">.</span>MARKETS</h1>
            <div class="brand-tag">INSTITUTIONAL QUANTITATIVE TRADING</div>
          </div>

          <!-- Main Content -->
          <div class="content-body">
            ${contentHtml}
            
            <!-- Security Footprint Stamp -->
            <div class="security-badge">
              🔒 <strong>256-Bit TLS End-to-End</strong> &bull; Equinix NY4 Cross-Connect &bull; Nexium FIX 4.4 Bridge
            </div>
          </div>

          <!-- Footer Information -->
          <div class="footer-section">
            <p style="margin: 0 0 12px 0; text-align: center; color: #94A3B8;">
              <strong>Nexium Markets Inc.</strong> &bull; Datacentre Equinix NY4 &bull; Global Operations Desk
            </p>
            <p style="margin: 0 0 16px 0; text-align: center;" class="footer-links">
              <a href="https://nexiummarkets.com/NEXIUM">Espace Client</a> •
              <a href="https://nexiummarkets.com/login">Connexion Sécurisée</a> •
              <a href="https://nexiummarkets.com/contact">Support Desk 24/7</a> •
              <a href="https://nexiummarkets.com/terms">Régulation & Risque</a>
            </p>
            <p style="margin: 0; font-size: 11px; text-align: center; color: #475569;">
              Cet e-mail institutionnel vous est adressé dans le cadre de la gestion de votre compte de trading algorithmique. Ne partagez jamais vos identifiants ou clés de sécurité.
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
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 9999px; padding: 6px 18px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #FBBF24; text-transform: uppercase;">
          ⏳ DOSSIER EN COURS DE VALIDATION
        </div>
      </div>

      <h2 class="h1-title" style="text-align: center;">Demande d'Ouverture Enregistrée</h2>
      
      <p style="text-align: center; font-size: 16px; color: #E2E8F0; margin-bottom: 28px;">
        Bonjour <strong>${clientName}</strong>,<br/>
        Nous vous confirmons la bonne prise en compte de votre inscription sur la plateforme institutionnelle <strong>Nexium Markets</strong>.
      </p>

      <div class="card-box">
        <div class="card-label">📋 Récapitulatif de votre Dossier</div>
        <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 14px; margin-top: 8px;">
          <tr>
            <td style="padding: 8px 0; color: #94A3B8; border-bottom: 1px solid rgba(255,255,255,0.06);">Titulaire du Compte :</td>
            <td style="padding: 8px 0; color: #FFFFFF; font-weight: bold; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">${clientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94A3B8; border-bottom: 1px solid rgba(255,255,255,0.06);">Pays de Résidence :</td>
            <td style="padding: 8px 0; color: #FFFFFF; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">${country || "France 🇫🇷"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94A3B8; border-bottom: 1px solid rgba(255,255,255,0.06);">Statut Réglementaire :</td>
            <td style="padding: 8px 0; color: #F59E0B; font-weight: bold; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">⏳ Attente Revue Conformité</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94A3B8;">Passerelle Allouée :</td>
            <td style="padding: 8px 0; color: #00E599; font-weight: bold; text-align: right;">Equinix NY4 Direct Cross-Connect</td>
          </tr>
        </table>
      </div>

      <div style="background: linear-gradient(135deg, rgba(0, 229, 153, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%); border: 1px solid rgba(0, 229, 153, 0.25); border-radius: 14px; padding: 20px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #00E599; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
          ⚡ Prochaines étapes
        </h4>
        <p style="margin: 0; font-size: 13px; color: #CBD5E1; line-height: 1.6;">
          Un administrateur de notre <strong>Desk de Supervision & Risque</strong> procède actuellement aux vérifications d'usage. Dès validation de votre compte, vous recevrez un e-mail officiel d'activation avec vos accès complets et le déverrouillage de votre Dashboard de trading algorithmique.
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0 16px;">
        <a href="https://nexiummarkets.com/login" class="btn-primary">
          🔐 Accéder au Portail de Connexion ➔
        </a>
      </div>

      <p style="text-align: center; margin-top: 20px; font-size: 13px; color: #94A3B8;">
        Besoin d'aide immédiate ? Contactez votre Desk Support 24/7 à <a href="mailto:support@nexiummarkets.com" style="color: #00E599; font-weight: bold; text-decoration: underline;">support@nexiummarkets.com</a>.
      </p>
    `
  );

  return sendResendEmail({
    to,
    subject,
    html,
  });
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
      <div style="display: inline-block; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 9999px; padding: 4px 14px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #F87171; text-transform: uppercase; margin-bottom: 12px;">
        NOTIFICATION DIRECTION & CONFORMITÉ
      </div>
      <h2 class="h1-title" style="color: #FFFFFF;">Nouveau Client en Attente d'Approbation</h2>
      <p>Un nouvel utilisateur vient de compléter son formulaire d'inscription sur la plateforme <strong>Nexium Markets</strong> et requiert une validation par l'administration.</p>

      <div class="card-box" style="border-color: rgba(245, 158, 11, 0.4);">
        <div class="card-label" style="color: #F59E0B;">👤 Fiche d'Inscription Client</div>
        <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 14px; margin-top: 8px;">
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Nom & Prénom :</td>
            <td style="padding: 6px 0; color: #FFFFFF; font-weight: bold; text-align: right;">${clientData.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Adresse E-mail :</td>
            <td style="padding: 6px 0; color: #00E599; font-weight: bold; text-align: right;">${clientData.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Pays de Résidence :</td>
            <td style="padding: 6px 0; color: #FFFFFF; text-align: right;">${clientData.country || "Non renseigné"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Téléphone :</td>
            <td style="padding: 6px 0; color: #FFFFFF; text-align: right;">${clientData.phone || "Non renseigné"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Code IB / Parrain :</td>
            <td style="padding: 6px 0; color: #E2E8F0; text-align: right;">${clientData.ibCode || "Aucun"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Statut Actuel :</td>
            <td style="padding: 6px 0; color: #F59E0B; font-weight: bold; text-align: right;">PENDING_APPROVAL</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="https://nexiummarkets.com/admin" class="btn-primary" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
          👑 Ouvrir la Console Admin pour Valider le Compte ➔
        </a>
      </div>
    `
  );

  return sendResendEmail({
    to: "support@nexiummarkets.com",
    subject,
    html,
  });
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
      <h2 class="h1-title">Bienvenue au sein de l'écosystème, ${clientName}</h2>
      <p>Votre compte institutionnel **Nexium Markets** a été activé avec succès. Vous bénéficiez d'une infrastructure de pointe avec connexion directe aux liquidités bancaires tierce-1 (NY4 Equinix).</p>

      <div class="card-box">
        <div class="card-label">📡 Passerelle MT5 ECN Directe</div>
        <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 14px; margin-top: 8px;">
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Serveur Institutionnel :</td>
            <td style="padding: 6px 0; color: #FFFFFF; font-weight: bold; text-align: right;">Nexium-Live-NY4</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Identifiant Compte :</td>
            <td style="padding: 6px 0; color: #00E599; font-weight: bold; text-align: right;">#${mt5Login || "Attribution en cours"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Pont Liquidité :</td>
            <td style="padding: 6px 0; color: #FFFFFF; text-align: right;">Fibre Optique FIX 4.4 (&lt; 1.2ms)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Protection du Capital :</td>
            <td style="padding: 6px 0; color: #00E599; font-weight: bold; text-align: right;">RiskGuard™ Actif 24/7</td>
          </tr>
        </table>
      </div>

      <p style="margin-top: 20px;">Vous pouvez dès à présent consulter votre tableau de bord, activer les stratégies IA et suivre vos télémesures de performance en direct.</p>

      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="https://nexiummarkets.com/NEXIUM" class="btn-primary">
          🚀 Accéder à Mon Espace Investisseur ➔
        </a>
      </div>
    `
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
      <h2 class="h1-title">Confirmation de Crédit de Fonds</h2>
      <p>Bonjour ${clientName},</p>
      <p>Nous vous confirmons la bonne exécution de votre dépôt. Le montant a été crédité et alloué à votre compte de trading avec succès.</p>

      <div class="card-box" style="border-color: rgba(0, 229, 153, 0.4);">
        <div class="card-label">💰 Détails de la Transaction</div>
        <div style="font-size: 28px; font-weight: 900; color: #00E599; font-family: monospace; margin: 10px 0;">
          +${amountFormatted}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 13px; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Compte MT5 Bénéficiaire :</td>
            <td style="padding: 6px 0; color: #FFFFFF; font-weight: bold; text-align: right;">#${mt5Login}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Référence Transaction :</td>
            <td style="padding: 6px 0; color: #CBD5E1; text-align: right;">${txRef || "NEX-" + Math.floor(100000 + Math.random() * 900000)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Disponibilité :</td>
            <td style="padding: 6px 0; color: #00E599; font-weight: bold; text-align: right;">Immédiate</td>
          </tr>
        </table>
      </div>

      <p>Vos stratégies quantitatives actives bénéficient désormais de cette marge supplémentaire pour optimiser les prises de position.</p>

      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="https://nexiummarkets.com/NEXIUM" class="btn-primary">
          Consulter Mon Solde en Temps Réel ➔
        </a>
      </div>
    `
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
      <h2 class="h1-title">Demande de Réinitialisation de Mot de Passe</h2>
      <p>Bonjour ${clientName},</p>
      <p>Nous avons reçu une demande de réinitialisation d'accès pour votre compte **Nexium Markets**.</p>

      <div class="card-box">
        <div class="card-label">🛡️ Procédure de Sécurité</div>
        <p style="margin: 0; font-size: 14px; color: #CBD5E1;">
          Cliquez sur le bouton ci-dessous pour choisir votre nouveau mot de passe. Ce lien est temporaire et expirera dans <strong>15 minutes</strong> pour des raisons de sécurité institutionnelle.
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0 20px;">
        <a href="${resetUrl}" class="btn-primary">
          🔑 Réinitialiser Mon Mot de Passe ➔
        </a>
      </div>

      <p style="font-size: 13px; color: #94A3B8; margin-top: 20px;">
        Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail. Votre mot de passe actuel reste inchangé et sécurisé.
      </p>
    `
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
      <h2 class="h1-title">Validation de votre Retrait</h2>
      <p>Bonjour ${clientName},</p>
      <p>Nous vous informons que votre demande de retrait a été validée par notre Desk Financier et le virement a été émis.</p>

      <div class="card-box" style="border-color: rgba(59, 130, 246, 0.4);">
        <div class="card-label" style="color: #60A5FA;">💳 Ordre de Virement Émis</div>
        <div style="font-size: 26px; font-weight: 900; color: #FFFFFF; font-family: monospace; margin: 10px 0;">
          ${amountFormatted}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 13px; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Destination des Fonds :</td>
            <td style="padding: 6px 0; color: #FFFFFF; font-weight: bold; text-align: right;">${destinationIbanOrWallet}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Réseau Bancaire :</td>
            <td style="padding: 6px 0; color: #00E599; font-weight: bold; text-align: right;">SEPA Instant / SWIFT Direct</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94A3B8;">Statut :</td>
            <td style="padding: 6px 0; color: #60A5FA; font-weight: bold; text-align: right;">Traité &amp; Exécuté</td>
          </tr>
        </table>
      </div>

      <p>Les fonds apparaîtront sur votre compte bancaire selon les délais habituels de votre établissement.</p>

      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="https://nexiummarkets.com/NEXIUM" class="btn-primary">
          Accéder à Mon Espace Client ➔
        </a>
      </div>
    `
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

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <p style="margin: 0; font-size: 14px; font-weight: bold; color: #FFFFFF;">
          ${advisorName || "Le Desk d'Opérations & Gestion de Compte"}
        </p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #00E599; font-family: monospace;">
          Nexium Markets Institutional Division
        </p>
      </div>

      <div style="text-align: center; margin: 28px 0 10px;">
        <a href="https://nexiummarkets.com/login" class="btn-primary">
          Répondre depuis mon Espace Client ➔
        </a>
      </div>
    `
  );

  return sendViaResendHttp(to, subject, html);
}
