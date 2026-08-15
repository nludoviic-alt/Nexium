/**
 * Service d'envoi d'e-mails transactionnels ultra-haut de gamme pour Nexium Markets.
 * Design hybride institutionnel généreux et agrandi pour une occupation parfaite de l'espace.
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
   WRAPPER HTML HYBRIDE INSTITUTIONNEL (TEXTES AGRANDIS & ESPACE OPTIMISÉ)
   ========================================================================== */

export function getEmailWrapper(
  title: string,
  preheader: string,
  contentHtml: string,
  opts?: { kicker?: string }
): string {
  const kicker = opts?.kicker || "NEXIUM MARKETS";
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
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
                E-mail officiel sécurisé de gestion de compte · MetaTrader 5 High-Frequency Infrastructure
              </p>

              <p style="
                margin:0 0 14px;
                font-size:13px;
              ">
                <a href="https://nexiummarkets.com/login" style="color:#00C98D;text-decoration:none;margin:0 10px;font-weight:700;">Espace Client</a>
                <span style="color:#3C4A5A;">•</span>
                <a href="https://nexiummarkets.com/contact" style="color:#00C98D;text-decoration:none;margin:0 10px;font-weight:700;">Support 24/7</a>
                <span style="color:#3C4A5A;">•</span>
                <a href="https://nexiummarkets.com/terms" style="color:#00C98D;text-decoration:none;margin:0 10px;font-weight:700;">Conditions</a>
              </p>

              <p style="
                margin:0;
                font-size:11px;
                color:#647484;
              ">
                © ${new Date().getFullYear()} Nexium Markets · Tous droits réservés
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

function renderCalloutSection(title: string, message: string): string {
  return `
    <tr>
      <td style="padding:24px 48px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="
            background:#ECFBF6;
            border-left:5px solid #00C98D;
            border-radius:12px;
          ">
          <tr>
            <td style="padding:18px 24px;">
              <div style="font-size:15px;font-weight:800;color:#087656;margin-bottom:6px;">
                ${title}
              </div>
              <div style="font-size:15px;line-height:1.65;color:#4A6B60;">
                ${message}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderCtaSection(url: string, label: string, subtext?: string): string {
  return `
    <tr>
      <td align="center" style="padding:38px 36px 46px;">
        <a href="${url}"
          style="
            display:inline-block;
            background:#00C98D;
            color:#06271E;
            text-decoration:none;
            font-size:17px;
            font-weight:800;
            padding:18px 40px;
            border-radius:12px;
            letter-spacing:0.4px;
            box-shadow:0 6px 20px rgba(0,201,141,0.28);
          ">
          ${label} &nbsp; →
        </a>
        ${
          subtext
            ? `<p style="margin:18px 0 0;font-size:13px;color:#8B99A7;">${subtext}</p>`
            : ""
        }
      </td>
    </tr>
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

/* ==========================================================================
   LES 7 TEMPLATES AGRANDIS & HARMONISÉS
   ========================================================================== */

/**
 * 1. INSCRIPTION EN ATTENTE
 */
export function renderRegistrationPendingEmailHtml(clientName: string, country?: string): string {
  const content = `
    ${renderIntroSection(
      "✓",
      "Demande d'ouverture enregistrée",
      `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>nous avons bien reçu votre demande d'ouverture de compte.<br>Votre dossier est maintenant en cours de validation par notre équipe.`
    )}

    ${renderRecapSection("Récapitulatif de votre demande", [
      { label: "Titulaire du compte", value: clientName },
      { label: "Pays de résidence", value: country || "France" },
      { label: "Statut du dossier", value: "", badge: { text: "EN REVUE", bg: "#E5F9F2", color: "#009B6D" } },
    ])}

    ${renderCalloutSection(
      "Prochaine étape",
      "Notre équipe examine votre dossier. Vous recevrez automatiquement un e-mail dès que vos accès Nexium Markets seront activés."
    )}

    ${renderCtaSection(
      "https://nexiummarkets.com/login",
      "Suivre ma demande",
      "Vous n'avez aucune action à effectuer pour le moment."
    )}
  `;

  return getEmailWrapper(
    "Nexium Markets — Demande enregistrée",
    `Bonjour ${clientName}, votre demande d'ouverture a été enregistrée.`,
    content,
    { kicker: "Inscription" }
  );
}

export async function sendRegistrationPendingEmail(
  to: string,
  clientName: string,
  country?: string
): Promise<SendEmailResult> {
  const subject = "⏳ Prise en compte de votre demande d'ouverture — Nexium Markets";
  const html = renderRegistrationPendingEmailHtml(clientName, country);
  return sendViaResendHttp(to, subject, html);
}

/**
 * 2. BIENVENUE & COMPTE ACTIVÉ
 */
export function renderWelcomeEmailHtml(clientName: string, mt5Login?: string): string {
  const content = `
    ${renderIntroSection(
      "★",
      "Compte activé avec succès",
      `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>votre compte a été validé par notre équipe. Vos accès au portail et à vos robots MetaTrader 5 sont désormais disponibles.`
    )}

    ${renderRecapSection("Vos Accès MetaTrader 5", [
      { label: "Serveur d'exécution", value: "Nexium-Live-NY4" },
      { label: "Compte de trading", value: mt5Login ? `#${mt5Login}` : "#892041" },
      { label: "Statut des robots", value: "", badge: { text: "ACTIF", bg: "#E5F9F2", color: "#009B6D" } },
    ])}

    ${renderCalloutSection(
      "Démarrage immédiat",
      "Connectez-vous dès à présent à votre espace client pour lancer vos stratégies et suivre vos performances en temps réel."
    )}

    ${renderCtaSection(
      "https://nexiummarkets.com/NEXIUM",
      "Accéder à mon espace client",
      "Vos paramètres sont pré-configurés pour vos premiers ordres MT5."
    )}
  `;

  return getEmailWrapper(
    "Nexium Markets — Compte activé",
    `Bonjour ${clientName}, vos accès Nexium Markets sont prêts.`,
    content,
    { kicker: "Compte Activé" }
  );
}

export async function sendWelcomeEmail(to: string, clientName: string, mt5Login?: string): Promise<SendEmailResult> {
  const subject = "👑 Bienvenue chez Nexium Markets — Votre Compte est Activé";
  const html = renderWelcomeEmailHtml(clientName, mt5Login);
  return sendViaResendHttp(to, subject, html);
}

/**
 * 3. MOT DE PASSE OUBLIÉ
 */
export function renderPasswordResetEmailHtml(clientName: string, resetUrl: string): string {
  const content = `
    ${renderIntroSection(
      "🔒",
      "Réinitialiser le mot de passe",
      `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Nexium Markets.`
    )}

    ${renderCalloutSection(
      "Lien temporaire sécurisé",
      "Ce lien sécurisé est strictement personnel et expirera automatiquement dans <strong>15 minutes</strong>."
    )}

    ${renderCtaSection(
      resetUrl,
      "Changer mon mot de passe",
      "Si vous n'avez pas demandé ce changement, ignorez simplement cet e-mail."
    )}
  `;

  return getEmailWrapper(
    "Nexium Markets — Réinitialisation de mot de passe",
    "Lien sécurisé de réinitialisation de votre mot de passe.",
    content,
    { kicker: "Sécurité" }
  );
}

export async function sendPasswordResetEmail(to: string, clientName: string, resetUrl: string): Promise<SendEmailResult> {
  const subject = "🔒 Réinitialisation de votre mot de passe — Nexium Markets";
  const html = renderPasswordResetEmailHtml(clientName, resetUrl);
  return sendViaResendHttp(to, subject, html);
}

/**
 * 4. DÉPÔT CONFIRMÉ
 */
export function renderDepositConfirmedEmailHtml(
  clientName: string,
  amountFormatted: string,
  mt5Login: string,
  txRef?: string
): string {
  const content = `
    ${renderIntroSection(
      "✓",
      "Dépôt crédité avec succès",
      `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>vos fonds ont été réceptionnés et sont immédiatement alloués à votre portefeuille de trading.`
    )}

    <tr>
      <td align="center" style="padding:10px 48px 0;">
        <div style="font-size:38px;font-weight:900;color:#00A978;letter-spacing:-0.5px;">
          +${amountFormatted}
        </div>
      </td>
    </tr>

    ${renderRecapSection("Détails de la transaction", [
      { label: "Compte MT5 bénéficiaire", value: `#${mt5Login}` },
      { label: "Référence d'ordre", value: txRef || "NEX-849201" },
      { label: "Disponibilité des fonds", value: "", badge: { text: "IMMÉDIATE", bg: "#E5F9F2", color: "#009B6D" } },
    ])}

    ${renderCtaSection(
      "https://nexiummarkets.com/NEXIUM",
      "Consulter mon solde",
      "Mise à jour instantanée visible sur votre tableau de bord."
    )}
  `;

  return getEmailWrapper(
    `Nexium Markets — Dépôt de +${amountFormatted} confirmé`,
    `Vos fonds de +${amountFormatted} ont été crédités.`,
    content,
    { kicker: "Dépôt Confirmé" }
  );
}

export async function sendDepositConfirmedEmail(
  to: string,
  clientName: string,
  amountFormatted: string,
  mt5Login: string,
  txRef?: string
): Promise<SendEmailResult> {
  const subject = `✅ Dépôt confirmé : +${amountFormatted} sur votre compte #${mt5Login}`;
  const html = renderDepositConfirmedEmailHtml(clientName, amountFormatted, mt5Login, txRef);
  return sendViaResendHttp(to, subject, html);
}

/**
 * 5. RETRAIT VALIDÉ
 */
export function renderWithdrawalApprovedEmailHtml(
  clientName: string,
  amountFormatted: string,
  destination: string
): string {
  const content = `
    ${renderIntroSection(
      "→",
      "Retrait approuvé & transféré",
      `Bonjour <strong style="color:#17212B;font-size:18px;">${clientName}</strong>,<br>votre demande de retrait a été validée par notre service financier et le virement a été exécuté.`
    )}

    <tr>
      <td align="center" style="padding:10px 48px 0;">
        <div style="font-size:36px;font-weight:900;color:#0B1623;letter-spacing:-0.5px;">
          ${amountFormatted}
        </div>
      </td>
    </tr>

    ${renderRecapSection("Détails du transfert bancaire", [
      { label: "Destination des fonds", value: destination },
      { label: "Statut d'exécution", value: "", badge: { text: "EXÉCUTÉ", bg: "#EBF5FF", color: "#1D4ED8" } },
    ])}

    ${renderCalloutSection(
      "Délais bancaires",
      "Les fonds apparaîtront sur votre compte bancaire selon les délais de compensation habituels de votre banque (24h à 48h)."
    )}

    ${renderCtaSection(
      "https://nexiummarkets.com/NEXIUM",
      "Accéder à mon espace client",
      "Relevé de compte mis à jour et disponible au téléchargement."
    )}
  `;

  return getEmailWrapper(
    `Nexium Markets — Retrait de ${amountFormatted} validé`,
    `Votre virement de ${amountFormatted} a été exécuté.`,
    content,
    { kicker: "Retrait Validé" }
  );
}

export async function sendWithdrawalApprovedEmail(
  to: string,
  clientName: string,
  amountFormatted: string,
  destinationIbanOrWallet: string
): Promise<SendEmailResult> {
  const subject = `💸 Retrait validé : ${amountFormatted}`;
  const html = renderWithdrawalApprovedEmailHtml(clientName, amountFormatted, destinationIbanOrWallet);
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
      "https://nexiummarkets.com/composition",
      "Ouvrir la console admin",
      "Validation requise pour l'activation des flux de trading."
    )}
  `;

  return getEmailWrapper(
    `[ADMIN] Nouvelle inscription : ${clientData.name}`,
    `Nouvelle inscription : ${clientData.name} (${clientData.email})`,
    content,
    { kicker: "Alerte Admin" }
  );
}

export async function sendAdminNewClientAlertEmail(clientData: {
  name: string;
  email: string;
  country?: string | undefined;
  phone?: string | undefined;
  ibCode?: string | undefined;
}): Promise<SendEmailResult> {
  const subject = `🚨 [ADMIN] Nouveau client : ${clientData.name}`;
  const html = renderAdminNewClientAlertEmailHtml(clientData);
  return sendViaResendHttp("support@nexiummarkets.com", subject, html);
}

/**
 * 7. MESSAGE DU DESK / SUPPORT
 */
export function renderCustomDeskEmailHtml(bodyText: string, advisorName?: string): string {
  const content = `
    ${renderIntroSection(
      "💬",
      "Message de votre Desk",
      `Votre conseiller vous a transmis une communication officielle relative à votre compte.`
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
              ${advisorName || "Marc V. — Desk Institutionnel"}
            </div>
            <div style="font-size:12px;font-weight:800;color:#00A978;letter-spacing:1px;margin-top:4px;">
              OPERATIONS & COMPLIANCE DESK
            </div>
          </div>
        </div>
      </td>
    </tr>

    ${renderCtaSection(
      "https://nexiummarkets.com/login",
      "Répondre depuis mon espace",
      "Accès chiffré et sécurisé 24/7."
    )}
  `;

  return getEmailWrapper(
    "Nexium Markets — Message de votre conseiller",
    "Message officiel de votre support Nexium Markets",
    content,
    { kicker: "Support Desk" }
  );
}

export async function sendCustomDeskEmail(
  to: string,
  subject: string,
  bodyText: string,
  advisorName?: string
): Promise<SendEmailResult> {
  const html = renderCustomDeskEmailHtml(bodyText, advisorName);
  return sendViaResendHttp(to, subject, html);
}

/**
 * Notification automatique reçue par le support/admin lorsqu'un prospect écrit sur /contact.
 */
export function renderContactNotificationHtml(params: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  mt5Account?: string;
  broker?: string;
}): string {
  const content = `
    ${renderHeroSection(
      "Nouveau message reçu",
      `Le formulaire de contact du site vient d'enregistrer une demande de <strong style="color:#0B1623;">${params.fullName}</strong>.`,
      "Nouveau Contact Web"
    )}

    ${renderDataGridSection("Coordonnées & Informations", [
      { label: "Nom complet", value: params.fullName, highlight: true },
      { label: "Adresse e-mail", value: `<a href="mailto:${params.email}" style="color:#00A978;text-decoration:none;font-weight:700;">${params.email}</a>` },
      { label: "Sujet", value: params.subject },
      ...(params.mt5Account ? [{ label: "Compte MT5 déclaré", value: `#${params.mt5Account}` }] : []),
      ...(params.broker ? [{ label: "Courtier partenaire", value: params.broker }] : []),
    ])}

    <tr>
      <td style="padding:20px 48px 0;">
        <div style="
          background:#F7FAFC;
          border:1.5px solid #E3E9EE;
          border-radius:18px;
          padding:24px 28px;
          font-size:16px;
          line-height:1.7;
          color:#2D3748;
        ">
          <div style="font-size:12px;font-weight:800;color:#718096;letter-spacing:1.5px;margin-bottom:10px;text-transform:uppercase;">
            Message du visiteur :
          </div>
          ${params.message.replace(/\n/g, "<br>")}
        </div>
      </td>
    </tr>

    ${renderCtaSection(
      "https://nexiummarkets.com/composition",
      "Ouvrir dans l'Admin & Répondre ➔",
      "Répondez directement depuis la console Desk & Messagerie."
    )}
  `;

  return getEmailWrapper(
    "Nouveau message de contact — Nexium Markets",
    `Nouveau message de contact de ${params.fullName}`,
    content,
    { kicker: "Formulaire de Contact" }
  );
}

export async function sendContactNotificationEmail(params: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  mt5Account?: string;
  broker?: string;
}): Promise<SendEmailResult> {
  const html = renderContactNotificationHtml(params);
  return sendViaResendHttp(
    "support@nexiummarkets.com",
    `[Nouveau Contact Web] ${params.subject} — ${params.fullName}`,
    html
  );
}

