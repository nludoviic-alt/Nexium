import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAccounts, emailAttachments, emailConversations, emailMessages } from "../db/schema.js";
import { env, isOvhConfigured } from "./env.js";
import { readAttachment } from "./attachments.js";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!isOvhConfigured) {
    throw new Error("SMTP non configuré (EMAIL_ADDRESS/EMAIL_PASSWORD/SMTP_HOST manquants).");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST!,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.EMAIL_ADDRESS!, pass: env.EMAIL_PASSWORD! },
    });
  }
  return transporter;
}

export class SendReplyError extends Error {}

// §8 : le client ne voit jamais que "Nom entreprise <contact@mondomaine.com>", jamais
// l'agent qui a répondu — ça reste une information interne (sentByUserId).
export async function sendReply(params: {
  conversationId: string;
  bodyText: string;
  bodyHtml: string;
  sentByUserId: string;
  attachmentIds?: string[];
}) {
  const [conversation] = await db.select().from(emailConversations).where(eq(emailConversations.id, params.conversationId)).limit(1);
  if (!conversation) throw new SendReplyError("Conversation introuvable.");

  const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, conversation.accountId)).limit(1);
  if (!account) throw new SendReplyError("Compte e-mail introuvable.");

  const [lastMessage] = await db
    .select()
    .from(emailMessages)
    .where(eq(emailMessages.conversationId, params.conversationId))
    .orderBy(desc(emailMessages.receivedAt))
    .limit(1);

  const referencesChain = [lastMessage?.references, lastMessage?.messageId].filter(Boolean).join(" ").trim();
  const subject = conversation.subject.toLowerCase().startsWith("re:") ? conversation.subject : `Re: ${conversation.subject}`;

  const attachmentsPayload: { filename: string; content: Buffer; contentType: string }[] = [];
  if (params.attachmentIds?.length) {
    const rows = await db.select().from(emailAttachments).where(inArray(emailAttachments.id, params.attachmentIds));
    for (const row of rows) {
      const content = await readAttachment(row.storedFilename);
      attachmentsPayload.push({ filename: row.filename, content, contentType: row.mimeType });
    }
  }

  const messageRowId = randomUUID();
  let providerMessageId = `<pending-${messageRowId}@nexiummarkets.local>`;
  let sendStatus: "SENT" | "FAILED" = "SENT";

  try {
    const info = await getTransporter().sendMail({
      from: `"${account.displayName}" <${account.emailAddress}>`,
      to: conversation.customerEmail,
      subject,
      text: params.bodyText,
      html: params.bodyHtml,
      inReplyTo: lastMessage?.messageId,
      references: referencesChain || undefined,
      attachments: attachmentsPayload,
    });
    providerMessageId = info.messageId ?? providerMessageId;
  } catch (err) {
    sendStatus = "FAILED";
    await db.insert(emailMessages).values({
      id: messageRowId,
      conversationId: params.conversationId,
      messageId: providerMessageId,
      inReplyTo: lastMessage?.messageId ?? null,
      references: referencesChain || null,
      direction: "OUTBOUND",
      fromEmail: account.emailAddress,
      fromName: account.displayName,
      toEmail: conversation.customerEmail,
      subject,
      bodyHtml: params.bodyHtml,
      bodyText: params.bodyText,
      sentByUserId: params.sentByUserId,
      sendStatus,
    });
    throw new SendReplyError(`Échec de l'envoi SMTP : ${(err as Error).message}`);
  }

  await db.insert(emailMessages).values({
    id: messageRowId,
    conversationId: params.conversationId,
    messageId: providerMessageId,
    inReplyTo: lastMessage?.messageId ?? null,
    references: referencesChain || null,
    direction: "OUTBOUND",
    fromEmail: account.emailAddress,
    fromName: account.displayName,
    toEmail: conversation.customerEmail,
    subject,
    bodyHtml: params.bodyHtml,
    bodyText: params.bodyText,
    sentByUserId: params.sentByUserId,
    sendStatus,
  });

  if (params.attachmentIds?.length) {
    await db.update(emailAttachments).set({ messageId: messageRowId }).where(inArray(emailAttachments.id, params.attachmentIds));
  }

  await db
    .update(emailConversations)
    .set({ lastMessageAt: sql`(current_timestamp)`, updatedAt: sql`(current_timestamp)` })
    .where(eq(emailConversations.id, params.conversationId));

  return { messageId: messageRowId, providerMessageId, sendStatus };
}
