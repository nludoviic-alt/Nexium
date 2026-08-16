import { Router } from "express";
import { and, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAgents, emailAttachments, emailConversations, emailMessages, emailNotes } from "../db/schema.js";
import type { ConversationStatus } from "../db/schema.js";
import { canActOnConversation, canReassignFreely, canTransfer } from "../lib/permissions.js";
import { assignConversation } from "../lib/assignment.js";
import { sendNew, SendReplyError } from "../lib/smtp.js";
import { sanitizeEmailHtml, stripHtmlToText } from "../lib/sanitize.js";

export const conversationsRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Compose un nouvel e-mail depuis zéro (pas une réponse à un fil existant).
conversationsRouter.post("/conversations", async (req, res) => {
  const agent = req.agent!;
  const to = String(req.body?.to ?? "").trim();
  const subject = String(req.body?.subject ?? "").trim();
  const text = String(req.body?.text ?? "").trim();

  if (!to || !EMAIL_RE.test(to)) return res.status(400).json({ error: "invalid_recipient" });
  if (!subject) return res.status(400).json({ error: "missing_subject" });
  if (!text) return res.status(400).json({ error: "empty_body" });

  const bodyHtml = sanitizeEmailHtml(`<p>${text.replace(/\n/g, "<br/>")}</p>`);

  try {
    const result = await sendNew({
      to,
      subject,
      bodyText: stripHtmlToText(bodyHtml),
      bodyHtml,
      sentByUserId: agent.id,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof SendReplyError) {
      return res.status(502).json({ error: "send_failed", message: err.message });
    }
    throw err;
  }
});

const FILTER_TO_STATUS: Record<string, ConversationStatus | undefined> = {
  unassigned: "NON_ASSIGNE",
  in_progress: "EN_COURS",
  waiting: "EN_ATTENTE",
  resolved: "RESOLU",
  archived: "ARCHIVE",
};

// §3 : compteurs pour la colonne de navigation.
conversationsRouter.get("/conversations/counts", async (req, res) => {
  const agentId = req.agent!.id;

  const countWhere = async (where: SQL | undefined) => {
    const [row] = await db.select({ n: count() }).from(emailConversations).where(where);
    return row?.n ?? 0;
  };

  const [inbox, mine, unassigned, inProgress, waiting, resolved, archived] = await Promise.all([
    countWhere(sql`${emailConversations.status} != 'ARCHIVE'`),
    countWhere(eq(emailConversations.assignedUserId, agentId)),
    countWhere(eq(emailConversations.status, "NON_ASSIGNE")),
    countWhere(eq(emailConversations.status, "EN_COURS")),
    countWhere(eq(emailConversations.status, "EN_ATTENTE")),
    countWhere(eq(emailConversations.status, "RESOLU")),
    countWhere(eq(emailConversations.status, "ARCHIVE")),
  ]);

  res.json({ inbox, mine, unassigned, inProgress, waiting, resolved, archived });
});

// §3 : liste des conversations (colonne 2), avec recherche et filtres par onglet.
conversationsRouter.get("/conversations", async (req, res) => {
  const agentId = req.agent!.id;
  const filter = String(req.query.filter ?? "inbox");
  const search = String(req.query.search ?? "").trim();

  const conditions = [];
  if (filter === "mine") conditions.push(eq(emailConversations.assignedUserId, agentId));
  else if (FILTER_TO_STATUS[filter]) conditions.push(eq(emailConversations.status, FILTER_TO_STATUS[filter]!));
  else if (filter === "inbox") conditions.push(sql`${emailConversations.status} != 'ARCHIVE'`);
  // Les fils archivés ne remontent que via filter === "archived", jamais dans "inbox".

  if (search) {
    const like_ = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${emailConversations.subject})`, like_),
        like(sql`lower(${emailConversations.customerName})`, like_),
        like(sql`lower(${emailConversations.customerEmail})`, like_)
      )
    );
  }

  const rows = await db
    .select({
      conversation: emailConversations,
      assignedAgentName: emailAgents.name,
    })
    .from(emailConversations)
    .leftJoin(emailAgents, eq(emailConversations.assignedUserId, emailAgents.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(emailConversations.lastMessageAt))
    .limit(200);

  // Aperçu du dernier message + pièce jointe éventuelle, par conversation.
  const items = await Promise.all(
    rows.map(async ({ conversation, assignedAgentName }) => {
      const [lastMessage] = await db
        .select()
        .from(emailMessages)
        .where(eq(emailMessages.conversationId, conversation.id))
        .orderBy(desc(emailMessages.receivedAt))
        .limit(1);

      const [{ n: attachmentCount }] = await db
        .select({ n: count() })
        .from(emailAttachments)
        .innerJoin(emailMessages, eq(emailAttachments.messageId, emailMessages.id))
        .where(eq(emailMessages.conversationId, conversation.id));

      const unread = Boolean(
        lastMessage?.direction === "INBOUND" && (!conversation.lastReadAt || lastMessage.receivedAt > conversation.lastReadAt)
      );

      return {
        id: conversation.id,
        subject: conversation.subject,
        customerName: conversation.customerName,
        customerEmail: conversation.customerEmail,
        status: conversation.status,
        assignedUserId: conversation.assignedUserId,
        assignedAgentName,
        lastMessageAt: conversation.lastMessageAt,
        lastMessagePreview: lastMessage?.bodyText?.slice(0, 140) ?? "",
        attachmentCount,
        unread,
      };
    })
  );

  res.json({ items });
});

// §4 : détail complet d'une conversation (messages + notes), marquée comme lue.
conversationsRouter.get("/conversations/:id", async (req, res) => {
  const { id } = req.params;
  const [conversation] = await db.select().from(emailConversations).where(eq(emailConversations.id, id)).limit(1);
  if (!conversation) return res.status(404).json({ error: "not_found" });

  const [messages, notes, attachments] = await Promise.all([
    db.select().from(emailMessages).where(eq(emailMessages.conversationId, id)).orderBy(emailMessages.receivedAt),
    db
      .select({ note: emailNotes, authorName: emailAgents.name })
      .from(emailNotes)
      .leftJoin(emailAgents, eq(emailNotes.userId, emailAgents.id))
      .where(eq(emailNotes.conversationId, id))
      .orderBy(emailNotes.createdAt),
    db
      .select()
      .from(emailAttachments)
      .innerJoin(emailMessages, eq(emailAttachments.messageId, emailMessages.id))
      .where(eq(emailMessages.conversationId, id)),
  ]);

  let assignedAgentName: string | null = null;
  if (conversation.assignedUserId) {
    const [a] = await db.select({ name: emailAgents.name }).from(emailAgents).where(eq(emailAgents.id, conversation.assignedUserId)).limit(1);
    assignedAgentName = a?.name ?? null;
  }

  await db.update(emailConversations).set({ lastReadAt: sql`(current_timestamp)` }).where(eq(emailConversations.id, id));

  res.json({
    conversation: { ...conversation, assignedAgentName },
    messages,
    notes: notes.map((n) => ({ ...n.note, authorName: n.authorName })),
    attachments: attachments.map((a) => a.email_attachments),
  });
});

// §7 : un agent s'assigne une conversation non assignée (ou un admin réassigne librement).
conversationsRouter.post("/conversations/:id/claim", async (req, res) => {
  const { id } = req.params;
  const agent = req.agent!;
  const [conversation] = await db.select().from(emailConversations).where(eq(emailConversations.id, id)).limit(1);
  if (!conversation) return res.status(404).json({ error: "not_found" });

  if (conversation.assignedUserId && conversation.assignedUserId !== agent.id && !canReassignFreely(agent)) {
    return res.status(409).json({ error: "already_assigned", assignedUserId: conversation.assignedUserId });
  }

  await assignConversation({ conversationId: id, assignedToUserId: agent.id, assignedByUserId: agent.id, reason: "MANUAL_CLAIM" });
  res.json({ ok: true });
});

// §7 : transférer à un autre agent.
conversationsRouter.post("/conversations/:id/transfer", async (req, res) => {
  const { id } = req.params;
  const agent = req.agent!;
  const targetUserId = String(req.body?.targetUserId ?? "");
  if (!targetUserId) return res.status(400).json({ error: "missing_target" });

  const [conversation] = await db.select().from(emailConversations).where(eq(emailConversations.id, id)).limit(1);
  if (!conversation) return res.status(404).json({ error: "not_found" });

  const [target] = await db.select().from(emailAgents).where(eq(emailAgents.id, targetUserId)).limit(1);
  if (!target) return res.status(404).json({ error: "target_not_found" });

  if (!canTransfer(agent, conversation, true) && !canReassignFreely(agent)) {
    return res.status(403).json({ error: "forbidden" });
  }

  await assignConversation({ conversationId: id, assignedToUserId: targetUserId, assignedByUserId: agent.id, reason: "TRANSFER" });
  res.json({ ok: true });
});

// §11 : changement de statut, réservé à l'agent assigné ou à un admin.
conversationsRouter.patch("/conversations/:id/status", async (req, res) => {
  const { id } = req.params;
  const agent = req.agent!;
  const status = req.body?.status as ConversationStatus | undefined;
  const VALID: ConversationStatus[] = ["NON_ASSIGNE", "EN_COURS", "EN_ATTENTE", "RESOLU", "ARCHIVE"];
  if (!status || !VALID.includes(status)) return res.status(400).json({ error: "invalid_status" });

  const [conversation] = await db.select().from(emailConversations).where(eq(emailConversations.id, id)).limit(1);
  if (!conversation) return res.status(404).json({ error: "not_found" });
  if (!canActOnConversation(agent, conversation)) return res.status(403).json({ error: "forbidden" });

  await db
    .update(emailConversations)
    .set({ status, updatedAt: sql`(current_timestamp)` })
    .where(eq(emailConversations.id, id));

  res.json({ ok: true });
});
