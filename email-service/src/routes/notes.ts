import { Router } from "express";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailConversations, emailNotes } from "../db/schema.js";
import { canActOnConversation } from "../lib/permissions.js";

export const notesRouter = Router();

// §9 : note interne — jamais envoyée par e-mail, visible uniquement dans le dashboard.
notesRouter.post("/conversations/:id/notes", async (req, res) => {
  const { id } = req.params;
  const agent = req.agent!;
  const content = String(req.body?.content ?? "").trim();
  if (!content) return res.status(400).json({ error: "empty_note" });

  const [conversation] = await db.select().from(emailConversations).where(eq(emailConversations.id, id)).limit(1);
  if (!conversation) return res.status(404).json({ error: "not_found" });
  if (!canActOnConversation(agent, conversation)) return res.status(403).json({ error: "forbidden" });

  const noteId = randomUUID();
  await db.insert(emailNotes).values({ id: noteId, conversationId: id, userId: agent.id, content });
  await db.update(emailConversations).set({ updatedAt: sql`(current_timestamp)` }).where(eq(emailConversations.id, id));

  res.json({ ok: true, id: noteId });
});
