import { randomUUID } from "node:crypto";
import { db } from "./client.js";
import { emailAgents, emailAccounts, emailConversations, emailMessages, emailNotes } from "./schema.js";
import { env } from "../lib/env.js";

// Mêmes collaborateurs que INITIAL_STAFF dans src/routes/admin.tsx (mêmes ids), pour que
// l'assignation ait du sens dès aujourd'hui côté UI, avant que la vraie auth ne relie les
// deux référentiels.
const AGENTS = [
  { id: "adm-owner", name: "Marc-Aurèle V.", email: "owner@nexiummarkets.com", role: "OWNER" as const, availability: "DISPONIBLE" as const },
  { id: "adm-1", name: "Ludovic Moreau", email: "ludovic.moreau@trading-fund.ch", role: "SUPER_ADMIN" as const, availability: "DISPONIBLE" as const },
  { id: "adm-conseiller-1", name: "Julien Cassel", email: "julien.c@nexiummarkets.com", role: "CONSEILLER" as const, availability: "DISPONIBLE" as const },
  { id: "adm-2", name: "Elena Rostova", email: "elena.r@nexiummarkets.com", role: "SUPPORT" as const, availability: "OCCUPE" as const },
  { id: "adm-3", name: "Marc Albarran", email: "marc.a@nexiummarkets.com", role: "FINANCE" as const, availability: "PAUSE" as const },
  { id: "adm-quant-1", name: "Dr. Antoine Reynaud", email: "reynaud.quant@nexiummarkets.com", role: "QUANT" as const, availability: "HORS_LIGNE" as const },
];

async function main() {
  for (const agent of AGENTS) {
    await db.insert(emailAgents).values(agent).onConflictDoUpdate({
      target: emailAgents.id,
      set: { name: agent.name, email: agent.email, role: agent.role },
    });
  }

  const accountId = "acc-contact";
  await db
    .insert(emailAccounts)
    .values({
      id: accountId,
      emailAddress: env.EMAIL_ADDRESS ?? "contact@mondomaine.com",
      displayName: env.SENDER_DISPLAY_NAME,
      imapHost: env.IMAP_HOST ?? "ssl0.ovh.net",
      imapPort: env.IMAP_PORT,
      smtpHost: env.SMTP_HOST ?? "ssl0.ovh.net",
      smtpPort: env.SMTP_PORT,
      active: true,
    })
    .onConflictDoNothing();

  const existing = await db.select().from(emailConversations).limit(1);
  if (existing.length > 0) {
    console.log("[seed] Des conversations existent déjà, je ne touche pas aux données de démo.");
    return;
  }

  const now = Date.now();
  const iso = (offsetMin: number) => new Date(now - offsetMin * 60_000).toISOString();

  const demoConversations = [
    {
      id: randomUUID(),
      subject: "Demande concernant mon dossier",
      customerEmail: "jean.dupont@gmail.com",
      customerName: "Jean Dupont",
      assignedUserId: "adm-conseiller-1",
      status: "EN_COURS" as const,
      lastMessageAt: iso(7),
      messages: [
        { direction: "INBOUND" as const, from: "jean.dupont@gmail.com", fromName: "Jean Dupont", body: "Bonjour,\n\nJ'aimerais avoir des informations concernant l'ouverture de mon dossier client MT5. Pouvez-vous me confirmer où cela en est ?\n\nMerci d'avance.", offset: 11 },
        { direction: "OUTBOUND" as const, from: env.EMAIL_ADDRESS ?? "contact@mondomaine.com", fromName: env.SENDER_DISPLAY_NAME, sentBy: "adm-conseiller-1", body: "Bonjour M. Dupont,\n\nNous avons bien reçu votre demande, votre dossier est en cours de validation KYC. Vous recevrez une confirmation sous 24h.\n\nCordialement,\nSophie", offset: 4 },
      ],
    },
    {
      id: randomUUID(),
      subject: "Problème de connexion à mon espace client",
      customerEmail: "sarah.b@geneva-capital.ch",
      customerName: "Sarah Benali",
      assignedUserId: null,
      status: "NON_ASSIGNE" as const,
      lastMessageAt: iso(20),
      messages: [
        { direction: "INBOUND" as const, from: "sarah.b@geneva-capital.ch", fromName: "Sarah Benali", body: "Bonjour,\n\nJe n'arrive plus à me connecter à mon espace client depuis ce matin, le mot de passe n'est pas accepté. Pouvez-vous m'aider rapidement ?", offset: 20 },
      ],
    },
    {
      id: randomUUID(),
      subject: "Retour sur ma demande de retrait",
      customerEmail: "a.dupuis@pro-capital.fr",
      customerName: "Alexandre Dupuis",
      assignedUserId: "adm-3",
      status: "EN_ATTENTE" as const,
      lastMessageAt: iso(90),
      messages: [
        { direction: "INBOUND" as const, from: "a.dupuis@pro-capital.fr", fromName: "Alexandre Dupuis", body: "Bonjour,\n\nOù en est ma demande de retrait de $5,000 USD envoyée la semaine dernière ?", offset: 95 },
        { direction: "OUTBOUND" as const, from: env.EMAIL_ADDRESS ?? "contact@mondomaine.com", fromName: env.SENDER_DISPLAY_NAME, sentBy: "adm-3", body: "Bonjour M. Dupuis,\n\nVotre virement SEPA est en cours de traitement par notre partenaire bancaire, comptez encore 24 à 48h ouvrées.\n\nCordialement,\nMarc", offset: 90 },
      ],
      note: "Client déjà relancé par téléphone, en attente de confirmation bancaire.",
    },
  ];

  for (const conv of demoConversations) {
    await db.insert(emailConversations).values({
      id: conv.id,
      accountId,
      subject: conv.subject,
      customerEmail: conv.customerEmail,
      customerName: conv.customerName,
      assignedUserId: conv.assignedUserId,
      status: conv.status,
      lastMessageAt: conv.lastMessageAt,
    });

    for (const msg of conv.messages) {
      await db.insert(emailMessages).values({
        id: randomUUID(),
        conversationId: conv.id,
        messageId: `<demo-${randomUUID()}@nexiummarkets.local>`,
        direction: msg.direction,
        fromEmail: msg.from,
        fromName: msg.fromName,
        toEmail: msg.direction === "INBOUND" ? env.EMAIL_ADDRESS ?? "contact@mondomaine.com" : conv.customerEmail,
        subject: conv.subject,
        bodyText: msg.body,
        bodyHtml: `<p>${msg.body.replace(/\n/g, "<br/>")}</p>`,
        sentByUserId: "sentBy" in msg ? msg.sentBy : null,
        sendStatus: msg.direction === "OUTBOUND" ? "SENT" : null,
        receivedAt: iso(msg.offset),
      });
    }

    if (conv.note) {
      await db.insert(emailNotes).values({
        id: randomUUID(),
        conversationId: conv.id,
        userId: conv.assignedUserId ?? "adm-1",
        content: conv.note,
      });
    }
  }

  console.log(`[seed] ${AGENTS.length} agents et ${demoConversations.length} conversations de démo créés.`);
}

main()
  .catch((err) => {
    console.error("[seed] Échec :", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
