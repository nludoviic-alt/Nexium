/**
 * Service d'envoi d'e-mails transactionnels ultra-haut de gamme pour Nexium Markets.
 * Design hybride institutionnel généreux (680px card, Midnight Blue #0B1623 & Emeraude #00C98D).
 * Support bilingue complet (Français / Anglais).
 */

const resendApiKey = import.meta.env.VITE_RESEND_API_KEY || "";
const defaultFromEmail =
  import.meta.env.VITE_RESEND_FROM_EMAIL || "Nexium Markets <support@nexiummarkets.com>";

export const isResendConfigured = Boolean(
  resendApiKey &&
  resendApiKey.startsWith("re_") &&
  !resendApiKey.includes("your-api-key")
);

/* ==========================================================================
   WRAPPER HTML HYBRIDE INSTITUTIONNEL (680px CARD & MIDNIGHT BLUE)
   ========================================================================== */

export function getEmailWrapper(
  title: string,
  preheader: string,
  contentHtml: string,
  opts?: { kicker?: string; lang?: "fr" | "en" }
): string {
  const kicker = opts?.kicker || "NEXIUM MARKETS";
  const lang = opts?.lang || "fr";

  const footerText =
    lang === "fr"
      ? "E-mail officiel sécurisé de gestion de compte · MetaTrader 5 High-Frequency Infrastructure"
      : "Official verified account management notification · MetaTrader 5 High-Frequency Infrastructure";

  const clientAreaLabel = lang === "fr" ? "Espace Client" : "Client Portal";
  const supportLabel = lang === "fr" ? "Support 24/7" : "24/7 Support";
  const termsLabel = lang === "fr" ? "Conditions" : "Terms";
  const rightsLabel = lang === "fr" ? "Tous droits réservés" : "All rights reserved";

  return `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F3F6F8;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Preheader text for inbox preview -->
  <div style="display:none;font-size:1px;color:#F3F6F8;line-height:1px;max-height:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F6F8;">
    <tr>
      <td align="center" style="padding:45px 16px;">

        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="
            max-width:680px;
            background:#FFFFFF;
            border-radius:24px;
            overflow:hidden;
            box-shadow:0 14px 45px rgba(11,22,35,0.12);
          ">

          <!-- ================= HEADER BLEU NUIT ================= -->
          <tr>
            <td align="center"
              style="
                background:#0B1623;
                padding:46px 32px 42px;
                border-bottom:5px solid #00C98D;
              ">

              <div style="
                font-size:32px;
                font-weight:900;
                letter-spacing:6px;
                color:#FFFFFF;
              ">
                NEXIUM<span style="color:#00C98D;">.</span>MARKETS
              </div>

              <div style="
                margin-top:18px;
                display:inline-block;
                padding:9px 24px;
                background:rgba(0,201,141,0.14);
                border:1.5px solid #00C98D;
                border-radius:50px;
                font-size:12px;
                font-weight:800;
                letter-spacing:3.5px;
                color:#00E5A3;
                text-transform:uppercase;
              ">
                ${kicker}
              </div>

            </td>
          </tr>

          <!-- ================= CORPS PRINCIPAL ================= -->
          ${contentHtml}

          <!-- ================= FOOTER BLEU NUIT ================= -->
          <tr>
            <td align="center"
              style="
                background:#0B1623;
                padding:36px 40px;
              ">

              <div style="
                font-size:18px;
                font-weight:800;
                letter-spacing:4px;
                color:#FFFFFF;
                margin-bottom:12px;
              ">
                NEXIUM<span style="color:#00C98D;">.</span>MARKETS
              </div>

              <p style="
                margin:0 0 12px;
                font-size:12px;
                line-height:1.7;
                color:#9DAAB7;
              ">
                ${footerText}
              </p>

              <p style="
                margin:0 0 14px;
                font-size:13px;
              ">
                <a href="https://nexiummarkets.com/portal" style="color:#00C98D;text-decoration:none;margin:0 10px;font-weight:700;">${clientAreaLabel}</a>
                <span style="color:#3C4A5A;">•</span>
                <a href="https://nexiummarkets.com/contact" style="color:#00C98D;text-decoration:none;margin:0 10px;font-weight:700;">${supportLabel}</a>
                <span style="color:#3C4A5A;">•</span>
                <a href="https://nexiummarkets.com/terms" style="color:#00C98D;text-decoration:none;margin:0 10px;font-weight:700;">${termsLabel}</a>
              </p>

              <p style="
                margin:0;
                font-size:11px;
                color:#647484;
              ">
                © ${new Date().getFullYear()} Nexium Markets · ${rightsLabel}
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

function renderIntroSection(icon: string, title: string, bodyHtml: string, iconBg = "#E9FBF5", iconColor = "#00A978"): string {
  return `
    <tr>
      <td align="center" style="padding:46px 48px 18px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center"
              style="
                width:66px;
                height:66px;
                background:${iconBg};
                border-radius:50%;
                font-size:30px;
                color:${iconColor};
                font-weight:bold;
              ">
              ${icon}
            </td>
          </tr>
        </table>

        <h1 style="
          margin:24px 0 14px;
          font-size:30px;
          line-height:1.3;
          color:#0B1623;
          font-weight:800;
        ">
          ${title}
        </h1>

        <div style="
          margin:0;
          max-width:560px;
          font-size:17px;
          line-height:1.75;
          color:#718096;
        ">
          ${bodyHtml}
        </div>
      </td>
    </tr>
  `;
}

function renderRecapSection(
  title: string,
  rows: Array<{ label: string; value: string; badge?: { text: string; bg?: string; color?: string } }>
): string {
  const trs = rows
    .map((r, i) => {
      const isLast = i === rows.length - 1;
      const border = isLast ? "" : "border-bottom:1px solid #E5EBEF;";
      const valueCell = r.badge
        ? `<span style="
            display:inline-block;
            background:${r.badge.bg || "#E5F9F2"};
            color:${r.badge.color || "#009B6D"};
            font-size:13px;
            font-weight:800;
            padding:7px 16px;
            border-radius:50px;
            letter-spacing:0.8px;
          ">● &nbsp;${r.badge.text}</span>`
        : `<span style="font-size:17px;font-weight:700;color:#0B1623;">${r.value}</span>`;

      return `
        <tr>
          <td style="padding:16px 0;font-size:16px;color:#7A8998;${border}">
            ${r.label}
          </td>
          <td align="right" style="padding:16px 0;${border}">
            ${valueCell}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <tr>
      <td style="padding:26px 48px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="
            background:#F7FAFC;
            border:1.5px solid #E3E9EE;
            border-radius:18px;
          ">
          <tr>
            <td style="padding:28px 34px;">
              <div style="
                font-size:13px;
                font-weight:800;
                letter-spacing:3px;
                color:#00A978;
                margin-bottom:18px;
                text-transform:uppercase;
              ">
                ${title}
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${trs}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderCalloutSection(title: string, message: string, alertBg = "#EFF6FF", alertBorder = "#BFDBFE", alertColor = "#1D4ED8"): string {
  return `
    <tr>
      <td style="padding:24px 48px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="
            background:${alertBg};
            border-left:5px solid ${alertBorder};
            border-radius:12px;
          ">
          <tr>
            <td style="padding:20px 24px;">
              <div style="
                font-size:15px;
                font-weight:800;
                color:${alertColor};
                margin-bottom:6px;
              ">
                ${title}
              </div>
              <div style="
                font-size:15px;
                line-height:1.65;
                color:#4B5563;
              ">
                ${message}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderCtaSection(url: string, buttonText: string, note?: string): string {
  return `
    <tr>
      <td align="center" style="padding:40px 48px 48px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center"
              style="
                background:#00C98D;
                border-radius:14px;
                box-shadow:0 8px 24px rgba(0,201,141,0.35);
              ">
              <a href="${url}" target="_blank"
                style="
                  display:inline-block;
                  padding:18px 44px;
                  font-size:16px;
                  font-weight:900;
                  color:#0B1623;
                  text-decoration:none;
                  letter-spacing:1px;
                  text-transform:uppercase;
                ">
                ${buttonText} ➔
              </a>
            </td>
          </tr>
        </table>
        ${
          note
            ? `<div style="margin-top:16px;font-size:13px;color:#94A3B8;max-width:440px;line-height:1.5;">${note}</div>`
            : ""
        }
      </td>
    </tr>
  `;
}

/* ==========================================================================
   ENVOI HTTP VIA RESEND API
   ========================================================================== */

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendViaResendHttp(
  to: string,
  subject: string,
  html: string,
  from = defaultFromEmail
): Promise<SendEmailResult> {
  if (!isResendConfigured) {
    console.info(`[Resend Simulated] Destinataire: ${to} | Sujet: ${subject}`);
    return { success: true, id: `sim-${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.message || `HTTP ${res.status}` };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur réseau inconnue" };
  }
}

/* ==========================================================================
   LES 8 TEMPLATES TRANSACTIONNELS OFFICIELS
   ========================================================================== */

/**
 * 1. INSCRIPTION REÇUE (Confirmation client)
 */
export function renderRegistrationPendingEmailHtml(clientName: string, country?: string, lang: "fr" | "en" = "fr"): string {
  const isFr = lang === "fr";
  const content = `
    ${renderIntroSection(
      "⏳",
      isFr ? "Demande d'ouverture enregistrée" : "Account Application Received",
      isFr
        ? `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>nous avons bien reçu votre demande d'ouverture de compte.<br>Votre dossier est maintenant en cours de validation par notre équipe.`
        : `Hello <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>we have successfully received your account application.<br>Our compliance team is currently reviewing your profile.`
    )}

    ${renderRecapSection(isFr ? "Récapitulatif de votre demande" : "Application Summary", [
      { label: isFr ? "Titulaire du compte" : "Account Holder", value: clientName },
      { label: isFr ? "Pays de résidence" : "Country of Residence", value: country || (isFr ? "France" : "United Kingdom") },
      { label: isFr ? "Statut du dossier" : "File Status", value: "", badge: { text: isFr ? "EN REVUE" : "IN REVIEW", bg: "#E5F9F2", color: "#009B6D" } },
    ])}

    ${renderCalloutSection(
      isFr ? "Prochaine étape" : "Next Step",
      isFr
        ? "Notre équipe examine votre dossier. Vous recevrez automatiquement un e-mail dès que vos accès Nexium Markets seront activés."
        : "Our onboarding desk is verifying your information. You will receive an activation email as soon as your credentials are ready."
    )}

    ${renderCtaSection(
      "https://nexiummarkets.com/portal",
      isFr ? "Suivre ma demande" : "Track My Status",
      isFr ? "Vous n'avez aucune action à effectuer pour le moment." : "No further action is required from your side at this stage."
    )}
  `;

  return getEmailWrapper(
    isFr ? "Nexium Markets — Demande enregistrée" : "Nexium Markets — Application Received",
    isFr ? `Bonjour ${clientName}, votre demande a été enregistrée.` : `Hello ${clientName}, your application has been received.`,
    content,
    { kicker: isFr ? "Inscription" : "Registration", lang }
  );
}

export async function sendRegistrationPendingEmail(
  to: string,
  clientName: string,
  country?: string,
  lang: "fr" | "en" = "fr"
): Promise<SendEmailResult> {
  const subject = lang === "fr"
    ? "⏳ Prise en compte de votre demande d'ouverture — Nexium Markets"
    : "⏳ Account Application Received — Nexium Markets";
  const html = renderRegistrationPendingEmailHtml(clientName, country, lang);
  return sendViaResendHttp(to, subject, html);
}

/**
 * 2. BIENVENUE & COMPTE ACTIVÉ
 */
export function renderWelcomeEmailHtml(clientName: string, mt5Login?: string, lang: "fr" | "en" = "fr"): string {
  const isFr = lang === "fr";
  const content = `
    ${renderIntroSection(
      "★",
      isFr ? "Compte activé avec succès" : "Account Successfully Activated",
      isFr
        ? `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>votre compte a été validé par notre équipe. Vos accès au portail et à vos robots MetaTrader 5 sont désormais disponibles.`
        : `Hello <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>your account has been approved. Your access to the client portal and MT5 Expert Advisors is now fully active.`
    )}

    ${renderRecapSection(isFr ? "Vos Accès MetaTrader 5" : "Your MetaTrader 5 Credentials", [
      { label: isFr ? "Serveur d'exécution" : "Execution Server", value: "Nexium-Live-NY4 (Equinix)" },
      { label: isFr ? "Compte de trading" : "Trading Account ID", value: mt5Login ? `#${mt5Login}` : "#892041" },
      { label: isFr ? "Statut des robots" : "Algorithm Status", value: "", badge: { text: isFr ? "ACTIF" : "ACTIVE", bg: "#E5F9F2", color: "#009B6D" } },
    ])}

    ${renderCalloutSection(
      isFr ? "Démarrage immédiat" : "Instant Activation",
      isFr
        ? "Connectez-vous dès à présent à votre espace client pour lancer vos stratégies et suivre vos performances en temps réel."
        : "Log in to your executive dashboard to deploy your strategies and monitor live telemetry in real time."
    )}

    ${renderCtaSection(
      "https://nexiummarkets.com/portal",
      isFr ? "Accéder à mon espace client" : "Access My Client Portal",
      isFr ? "Vos paramètres sont pré-configurés pour vos premiers ordres MT5." : "Your parameters are pre-configured for low-latency MT5 order execution."
    )}
  `;

  return getEmailWrapper(
    isFr ? "Nexium Markets — Compte activé" : "Nexium Markets — Account Activated",
    isFr ? `Bonjour ${clientName}, vos accès Nexium Markets sont prêts.` : `Hello ${clientName}, your Nexium Markets access is ready.`,
    content,
    { kicker: isFr ? "Compte Activé" : "Account Active", lang }
  );
}

export async function sendWelcomeEmail(to: string, clientName: string, mt5Login?: string, lang: "fr" | "en" = "fr"): Promise<SendEmailResult> {
  const subject = lang === "fr"
    ? "👑 Bienvenue chez Nexium Markets — Votre Compte est Activé"
    : "👑 Welcome to Nexium Markets — Your Account is Ready";
  const html = renderWelcomeEmailHtml(clientName, mt5Login, lang);
  return sendViaResendHttp(to, subject, html);
}

/**
 * 3. MOT DE PASSE OUBLIÉ
 */
export function renderPasswordResetEmailHtml(clientName: string, resetUrl: string, lang: "fr" | "en" = "fr"): string {
  const isFr = lang === "fr";
  const content = `
    ${renderIntroSection(
      "🔒",
      isFr ? "Réinitialiser le mot de passe" : "Reset Your Password",
      isFr
        ? `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Nexium Markets.`
        : `Hello <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>we received a password recovery request for your Nexium Markets account.`
    )}

    ${renderCalloutSection(
      isFr ? "Lien temporaire sécurisé" : "Secure Temporary Link",
      isFr
        ? "Ce lien sécurisé est strictement personnel et expirera automatiquement dans <strong>15 minutes</strong>."
        : "This single-use recovery link is cryptographically signed and expires in <strong>15 minutes</strong>."
    )}

    ${renderCtaSection(
      resetUrl,
      isFr ? "Changer mon mot de passe" : "Reset Password Now",
      isFr ? "Si vous n'avez pas demandé ce changement, ignorez simplement cet e-mail." : "If you did not request this recovery, please safely disregard this email."
    )}
  `;

  return getEmailWrapper(
    isFr ? "Nexium Markets — Réinitialisation de mot de passe" : "Nexium Markets — Password Reset",
    isFr ? "Lien sécurisé de réinitialisation de votre mot de passe." : "Secure password reset authorization link.",
    content,
    { kicker: isFr ? "Sécurité" : "Security", lang }
  );
}

export async function sendPasswordResetEmail(to: string, clientName: string, resetUrl: string, lang: "fr" | "en" = "fr"): Promise<SendEmailResult> {
  const subject = lang === "fr"
    ? "🔒 Réinitialisation de votre mot de passe — Nexium Markets"
    : "🔒 Password Reset Request — Nexium Markets";
  const html = renderPasswordResetEmailHtml(clientName, resetUrl, lang);
  return sendViaResendHttp(to, subject, html);
}

/**
 * 4. DÉPÔT CONFIRMÉ
 */
export function renderDepositConfirmedEmailHtml(
  clientName: string,
  amountFormatted: string,
  mt5Login: string,
  txRef?: string,
  lang: "fr" | "en" = "fr"
): string {
  const isFr = lang === "fr";
  const content = `
    ${renderIntroSection(
      "✓",
      isFr ? "Dépôt crédité avec succès" : "Deposit Credited Successfully",
      isFr
        ? `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>vos fonds ont été réceptionnés et sont immédiatement alloués à votre portefeuille de trading.`
        : `Hello <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>your funds have been settled and are immediately allocated to your MT5 portfolio.`
    )}

    <tr>
      <td align="center" style="padding:10px 48px 0;">
        <div style="font-size:40px;font-weight:900;color:#00A978;letter-spacing:-0.5px;">
          +${amountFormatted}
        </div>
      </td>
    </tr>

    ${renderRecapSection(isFr ? "Détails de la transaction" : "Transaction Breakdown", [
      { label: isFr ? "Compte MT5 bénéficiaire" : "Destination MT5 Account", value: `#${mt5Login}` },
      { label: isFr ? "Référence d'ordre" : "Order Reference", value: txRef || "NEX-849201" },
      { label: isFr ? "Disponibilité des fonds" : "Fund Availability", value: "", badge: { text: isFr ? "IMMÉDIATE" : "IMMEDIATE", bg: "#E5F9F2", color: "#009B6D" } },
    ])}

    ${renderCtaSection(
      "https://nexiummarkets.com/portal",
      isFr ? "Consulter mon solde" : "View Live Balance",
      isFr ? "Mise à jour instantanée visible sur votre tableau de bord." : "Real-time telemetry reflects balance updates across all connected algorithms."
    )}
  `;

  return getEmailWrapper(
    isFr ? `Nexium Markets — Dépôt de +${amountFormatted} confirmé` : `Nexium Markets — Deposit of +${amountFormatted} confirmed`,
    isFr ? `Vos fonds de +${amountFormatted} ont été crédités.` : `Your deposit of +${amountFormatted} has been credited.`,
    content,
    { kicker: isFr ? "Dépôt Confirmé" : "Deposit Confirmed", lang }
  );
}

export async function sendDepositConfirmedEmail(
  to: string,
  clientName: string,
  amountFormatted: string,
  mt5Login: string,
  txRef?: string,
  lang: "fr" | "en" = "fr"
): Promise<SendEmailResult> {
  const subject = lang === "fr"
    ? `✅ Dépôt confirmé : +${amountFormatted} sur votre compte #${mt5Login}`
    : `✅ Deposit Confirmed: +${amountFormatted} on account #${mt5Login}`;
  const html = renderDepositConfirmedEmailHtml(clientName, amountFormatted, mt5Login, txRef, lang);
  return sendViaResendHttp(to, subject, html);
}

/**
 * 5. RETRAIT VALIDÉ
 */
export function renderWithdrawalApprovedEmailHtml(
  clientName: string,
  amountFormatted: string,
  destination: string,
  lang: "fr" | "en" = "fr"
): string {
  const isFr = lang === "fr";
  const content = `
    ${renderIntroSection(
      "→",
      isFr ? "Retrait approuvé & transféré" : "Withdrawal Approved & Transferred",
      isFr
        ? `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>votre demande de retrait a été validée par notre service financier et le virement a été exécuté.`
        : `Hello <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>your withdrawal request has been approved by finance and the payout has been dispatched.`
    )}

    <tr>
      <td align="center" style="padding:10px 48px 0;">
        <div style="font-size:38px;font-weight:900;color:#0B1623;letter-spacing:-0.5px;">
          ${amountFormatted}
        </div>
      </td>
    </tr>

    ${renderRecapSection(isFr ? "Détails du transfert bancaire" : "Transfer Details", [
      { label: isFr ? "Destination des fonds" : "Destination IBAN / Wallet", value: destination },
      { label: isFr ? "Statut d'exécution" : "Execution Status", value: "", badge: { text: isFr ? "EXÉCUTÉ" : "DISPATCHED", bg: "#EBF5FF", color: "#1D4ED8" } },
    ])}

    ${renderCalloutSection(
      isFr ? "Délais bancaires" : "Settlement Window",
      isFr
        ? "Les fonds apparaîtront sur votre compte bancaire selon les délais de compensation habituels de votre banque (24h à 48h)."
        : "Funds typically arrive in your account within standard interbank settlement times (24h to 48h)."
    )}

    ${renderCtaSection(
      "https://nexiummarkets.com/portal",
      isFr ? "Accéder à mon espace client" : "Access Client Portal",
      isFr ? "Relevé de compte mis à jour et disponible au téléchargement." : "Official statement available for export inside your portal."
    )}
  `;

  return getEmailWrapper(
    isFr ? `Nexium Markets — Retrait de ${amountFormatted} validé` : `Nexium Markets — Withdrawal of ${amountFormatted} processed`,
    isFr ? `Votre virement de ${amountFormatted} a été exécuté.` : `Your payout of ${amountFormatted} has been executed.`,
    content,
    { kicker: isFr ? "Retrait Validé" : "Withdrawal Processed", lang }
  );
}

export async function sendWithdrawalApprovedEmail(
  to: string,
  clientName: string,
  amountFormatted: string,
  destinationIbanOrWallet: string,
  lang: "fr" | "en" = "fr"
): Promise<SendEmailResult> {
  const subject = lang === "fr"
    ? `💸 Retrait validé : ${amountFormatted}`
    : `💸 Withdrawal Processed: ${amountFormatted}`;
  const html = renderWithdrawalApprovedEmailHtml(clientName, amountFormatted, destinationIbanOrWallet, lang);
  return sendViaResendHttp(to, subject, html);
}

/**
 * 6. ALERTE ADMIN NOUVEAU CLIENT
 */
export function renderAdminNewClientAlertEmailHtml(clientData: {
  name: string;
  email: string;
  country?: string | undefined;
  phone?: string | undefined;
  ibCode?: string | undefined;
}): string {
  const content = `
    ${renderIntroSection(
      "!",
      "Nouveau compte à valider",
      `Un nouvel investisseur vient de compléter son formulaire d'inscription sur la plateforme Nexium Markets.`,
      "#FEF3C7",
      "#D97706"
    )}

    ${renderRecapSection("Fiche Inscription Client", [
      { label: "Nom & Prénom", value: clientData.name },
      { label: "Adresse e-mail", value: clientData.email },
      { label: "Pays de résidence", value: clientData.country || "France" },
      { label: "Numéro de téléphone", value: clientData.phone || "Non renseigné" },
      { label: "Code IB / Parrain", value: clientData.ibCode || "Aucun" },
      { label: "Statut actuel", value: "", badge: { text: "EN ATTENTE", bg: "#FEF3C7", color: "#B45309" } },
    ])}

    ${renderCtaSection(
      "https://nexiummarkets.com/desk",
      "Ouvrir la console Desk",
      "Validation requise pour l'activation des flux de trading."
    )}
  `;

  return getEmailWrapper(
    `[ADMIN] Nouvelle inscription : ${clientData.name}`,
    `Nouvelle inscription : ${clientData.name} (${clientData.email})`,
    content,
    { kicker: "Alerte Desk" }
  );
}

export async function sendAdminNewClientAlertEmail(clientData: {
  name: string;
  email: string;
  country?: string | undefined;
  phone?: string | undefined;
  ibCode?: string | undefined;
}): Promise<SendEmailResult> {
  const subject = `🚨 [DESK] Nouveau client à valider : ${clientData.name}`;
  const html = renderAdminNewClientAlertEmailHtml(clientData);
  return sendViaResendHttp("support@nexiummarkets.com", subject, html);
}

/**
 * 7. NOTIFICATION ADMIN FORMULAIRE DE CONTACT
 */
export function renderContactNotificationHtml(params: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  mt5Account?: string | null | undefined;
  broker?: string | null | undefined;
}): string {
  const content = `
    ${renderIntroSection(
      "✉",
      "Nouveau message reçu",
      `Le formulaire de contact du site vient d'enregistrer une demande de <strong style="color:#0B1623;">${params.fullName}</strong>.`,
      "#EBF5FF",
      "#1D4ED8"
    )}

    ${renderRecapSection("Coordonnées & Demande", [
      { label: "Nom complet", value: params.fullName },
      { label: "Adresse email", value: params.email },
      { label: "Sujet de la demande", value: params.subject },
      ...(params.mt5Account ? [{ label: "Compte MT5", value: params.mt5Account }] : []),
      ...(params.broker ? [{ label: "Courtier / Broker", value: params.broker }] : []),
      { label: "Origine", value: "Page Contact / Anti-Spam Vérifié" },
    ])}

    <tr>
      <td style="padding:24px 48px 0;">
        <div style="
          background:#F8FAFC;
          border:1.5px solid #E2E8F0;
          border-radius:18px;
          padding:24px 28px;
          font-size:16px;
          line-height:1.75;
          color:#1E293B;
        ">
          <div style="font-size:12px;font-weight:800;letter-spacing:1.5px;color:#64748B;margin-bottom:10px;text-transform:uppercase;">
            Message du client :
          </div>
          ${params.message.replace(/\n/g, "<br>")}
        </div>
      </td>
    </tr>

    ${renderCtaSection(
      "https://nexiummarkets.com/desk",
      "Répondre depuis le Desk",
      "Le message a été automatiquement routé vers la file d'attente Messagerie du Desk."
    )}
  `;

  return getEmailWrapper(
    `[CONTACT] Nouveau message : ${params.subject} — ${params.fullName}`,
    `Demande reçue de ${params.fullName} (${params.email})`,
    content,
    { kicker: "Support Contact" }
  );
}

export async function sendContactNotificationEmail(params: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  mt5Account?: string | null | undefined;
  broker?: string | null | undefined;
}): Promise<SendEmailResult> {
  const subjectLine = `📨 [CONTACT DESK] ${params.subject} — ${params.fullName}`;
  const html = renderContactNotificationHtml(params);
  return sendViaResendHttp("support@nexiummarkets.com", subjectLine, html);
}

/**
 * 8. MESSAGE DU CONSEILLER DESK
 */
export function renderCustomDeskEmailHtml(
  bodyText: string,
  advisorName?: string,
  lang: "fr" | "en" = "fr"
): string {
  const isFr = lang === "fr";
  const content = `
    ${renderIntroSection(
      "💬",
      isFr ? "Message officiel de votre Desk" : "Official Message from your Desk",
      isFr
        ? `Votre conseiller institutionnel vous a transmis une communication officielle relative à votre compte.`
        : `Your institutional advisor has dispatched an official communication regarding your account.`
    )}

    <tr>
      <td style="padding:15px 48px 0;">
        <div style="
          background:#F7FAFC;
          border:1.5px solid #E3E9EE;
          border-radius:18px;
          padding:28px 32px;
          font-size:16px;
          line-height:1.75;
          color:#2D3748;
        ">
          ${bodyText.replace(/\n/g, "<br>")}
          
          <div style="border-top:1px solid #E5EBEF;padding-top:16px;margin-top:20px;">
            <div style="font-size:16px;font-weight:800;color:#0B1623;">
              ${advisorName || (isFr ? "Marc V. — Desk Institutionnel" : "Mark V. — Institutional Desk")}
            </div>
            <div style="font-size:12px;font-weight:800;color:#00A978;letter-spacing:1px;margin-top:4px;">
              OPERATIONS & COMPLIANCE DESK
            </div>
          </div>
        </div>
      </td>
    </tr>

    ${renderCtaSection(
      "https://nexiummarkets.com/portal",
      isFr ? "Accéder à mon espace client" : "Access Client Portal",
      isFr ? "Accès chiffré et sécurisé 24/7." : "24/7 encrypted secure connection."
    )}
  `;

  return getEmailWrapper(
    isFr ? "Nexium Markets — Message de votre conseiller" : "Nexium Markets — Advisor Message",
    isFr ? "Message officiel de votre support Nexium Markets" : "Official notification from Nexium Markets Support",
    content,
    { kicker: isFr ? "Support Desk" : "Support Desk", lang }
  );
}

export async function sendCustomDeskEmail(
  to: string,
  subject: string,
  bodyText: string,
  advisorName?: string,
  lang: "fr" | "en" = "fr"
): Promise<SendEmailResult> {
  const html = renderCustomDeskEmailHtml(bodyText, advisorName, lang);
  return sendViaResendHttp(to, subject, html);
}
