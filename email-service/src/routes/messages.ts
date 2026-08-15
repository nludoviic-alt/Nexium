import { Router } from "express";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAttachments, emailConversations } from "../db/schema.js";
import { canActOnConversation } from "../lib/permissions.js";
import { sendReply, SendReplyError } from "../lib/smtp.js";
import { sanitizeEmailHtml, stripHtmlToText } from "../lib/sanitize.js";
import { assignConversation } from "../lib/assignment.js";

export const messagesRouter = Router();

// §8 : répondre à un e-mail. Auto-claim si la conversation n'était pas assignée
// (l'agent qui répond en devient responsable), envoi SMTP via lib/smtp.ts.
messagesRouter.post("/conversations/:id/reply", async (req, res) => {
  const { id } = req.params;
  const agent = req.agent!;
  const bodyText = String(req.body?.text ?? "").trim();
  const attachmentIds: string[] = Array.isArray(req.body?.attachmentIds) ? req.body.attachmentIds : [];

  if (!bodyText) return res.status(400).json({ error: "empty_body" });

  const [conversation] = await db.select().from(emailConversations).where(eq(emailConversations.id, id)).limit(1);
  if (!conversation) return res.status(404).json({ error: "not_found" });
  if (!canActOnConversation(agent, conversation)) return res.status(403).json({ error: "forbidden" });

  // §16 : IDOR — les pièces jointes jointes à la réponse doivent appartenir à CETTE
  // conversation et avoir été uploadées par CET agent, et pas déjà consommées par un
  // autre message envoyé.
  if (attachmentIds.length) {
    const rows = await db.select().from(emailAttachments).where(inArray(emailAttachments.id, attachmentIds));
    const invalid = rows.find(
      (r) => r.conversationId !== id || r.uploadedByUserId !== agent.id || r.messageId !== null
    );
    if (invalid || rows.length !== attachmentIds.length) {
      return res.status(403).json({ error: "invalid_attachment" });
    }
  }

  if (conversation.assignedUserId === null) {
    await assignConversation({ conversationId: id, assignedToUserId: agent.id, assignedByUserId: agent.id, reason: "MANUAL_CLAIM" });
  }

  const bodyHtml = sanitizeEmailHtml(`<p>${bodyText.replace(/\n/g, "<br/>")}</p>`);

  try {
    const result = await sendReply({
      conversationId: id,
      bodyText: stripHtmlToText(bodyHtml),
      bodyHtml,
      sentByUserId: agent.id,
      attachmentIds,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof SendReplyError) {
      return res.status(502).json({ error: "send_failed", message: err.message });
    }
    throw err;
  }
});
