import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAccounts, emailAttachments, emailConversations, emailMessages } from "../db/schema.js";
import { env, isOvhConfigured } from "./env.js";
import { findExistingConversationId } from "./threading.js";
import { pickLeastBusyAvailableAgent } from "./routing.js";
import { assignConversation } from "./assignment.js";
import { sanitizeEmailHtml, stripHtmlToText } from "./sanitize.js";
import { saveAttachment, AttachmentRejectedError } from "./attachments.js";

// §13 : synchro idempotente — s'appuie sur (a) l'UID IMAP pour ne relire que les
// nouveaux messages et (b) l'unicité de messageId en base comme filet de sécurité si le
// process redémarre au milieu d'une synchro (fetch déjà fait, insert pas encore commité).
export async function syncInbox(): Promise<{ imported: number; skipped: number } | null> {
  if (!isOvhConfigured) {
    console.warn("[imap] Configuration OVH absente (EMAIL_ADDRESS/EMAIL_PASSWORD/IMAP_HOST) — synchro ignorée.");
    return null;
  }

  const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.active, true)).limit(1);
  if (!account) {
    console.warn("[imap] Aucun compte e-mail actif en base — lancez le seed d'abord.");
    return null;
  }

  const client = new ImapFlow({
    host: env.IMAP_HOST!,
    port: env.IMAP_PORT,
    secure: true,
    auth: { user: env.EMAIL_ADDRESS!, pass: env.EMAIL_PASSWORD! },
    logger: false,
  });

  let imported = 0;
  let skipped = 0;

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = client.mailbox && typeof client.mailbox === "object" ? client.mailbox : null;
      const uidNext = status && "uidNext" in status ? (status.uidNext as number) : undefined;

      // Premier passage : on ne remonte pas tout l'historique, seulement les ~200
      // derniers messages, pour éviter d'importer des années de boîte OVH d'un coup.
      const startUid = account.lastSyncedUid > 0 ? account.lastSyncedUid + 1 : Math.max(1, (uidNext ?? 200) - 200);

      let highestUid = account.lastSyncedUid;

      for await (const msg of client.fetch(
        { uid: `${startUid}:*` },
        { uid: true, source: true, envelope: true },
        { uid: true }
      )) {
        if (!msg.source) continue;
        highestUid = Math.max(highestUid, msg.uid);

        const parsed = await simpleParser(msg.source);
        const messageId = parsed.messageId ?? `<generated-${randomUUID()}@nexiummarkets.local>`;

        const [alreadyExists] = await db.select({ id: emailMessages.id }).from(emailMessages).where(eq(emailMessages.messageId, messageId)).limit(1);
        if (alreadyExists) {
          skipped++;
          continue;
        }

        const fromAddr = parsed.from?.value[0]?.address?.toLowerCase() ?? "inconnu@inconnu.local";
        const fromName = parsed.from?.value[0]?.name ?? null;
        const references = Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [];

        let conversationId = await findExistingConversationId({
          fromEmail: fromAddr,
          inReplyTo: parsed.inReplyTo ?? null,
          references,
        });

        const isNewConversation = !conversationId;
        if (!conversationId) {
          conversationId = randomUUID();
          await db.insert(emailConversations).values({
            id: conversationId,
            accountId: account.id,
            subject: parsed.subject ?? "(sans objet)",
            customerEmail: fromAddr,
            customerName: fromName,
            status: "NON_ASSIGNE",
            lastMessageAt: (parsed.date ?? new Date()).toISOString(),
          });
        }

        const bodyHtml = parsed.html ? sanitizeEmailHtml(parsed.html) : null;
        const bodyText = parsed.text ?? (bodyHtml ? stripHtmlToText(bodyHtml) : "");

        const messageRowId = randomUUID();
        await db.insert(emailMessages).values({
          id: messageRowId,
          conversationId,
          messageId,
          inReplyTo: parsed.inReplyTo ?? null,
          references: references.join(" ") || null,
          direction: "INBOUND",
          fromEmail: fromAddr,
          fromName,
          toEmail: account.emailAddress,
          subject: parsed.subject ?? null,
          bodyHtml,
          bodyText,
          receivedAt: (parsed.date ?? new Date()).toISOString(),
        });

        for (const att of parsed.attachments) {
          try {
            const { storedFilename, storagePath } = await saveAttachment(att.content, att.contentType);
            await db.insert(emailAttachments).values({
              id: randomUUID(),
              messageId: messageRowId,
              filename: att.filename ?? "piece-jointe",
              storedFilename,
              mimeType: att.contentType,
              size: att.size,
              storagePath,
            });
          } catch (err) {
            if (err instanceof AttachmentRejectedError) {
              console.warn(`[imap] Pièce jointe rejetée sur message ${messageId} : ${err.message}`);
            } else {
              throw err;
            }
          }
        }

        await db
          .update(emailConversations)
          .set({ lastMessageAt: (parsed.date ?? new Date()).toISOString(), updatedAt: sql`(current_timestamp)` })
          .where(eq(emailConversations.id, conversationId));

        // Routing (§6) uniquement pour les nouvelles conversations non assignées.
        if (isNewConversation) {
          const agentId = await pickLeastBusyAvailableAgent();
          if (agentId) {
            await assignConversation({ conversationId, assignedToUserId: agentId, assignedByUserId: null, reason: "AUTO_ROUTING" });
          }
        }

        imported++;
      }

      if (highestUid > account.lastSyncedUid) {
        await db
          .update(emailAccounts)
          .set({ lastSyncedUid: highestUid, lastSyncedAt: sql`(current_timestamp)` })
          .where(eq(emailAccounts.id, account.id));
      } else {
        await db.update(emailAccounts).set({ lastSyncedAt: sql`(current_timestamp)` }).where(eq(emailAccounts.id, account.id));
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }

  if (imported > 0 || skipped > 0) {
    console.log(`[imap] Synchro terminée : ${imported} message(s) importé(s), ${skipped} déjà connu(s).`);
  }
  return { imported, skipped };
}

// Permet `npm run sync:once` en local pour tester manuellement (npx tsx src/lib/imap.ts).
if (process.argv[1]?.endsWith("imap.ts") || process.argv[1]?.endsWith("imap.js")) {
  syncInbox()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[imap] Erreur de synchro :", err);
      process.exit(1);
    });
}
