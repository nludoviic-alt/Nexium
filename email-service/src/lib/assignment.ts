import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAssignments, emailConversations } from "../db/schema.js";
import type { AssignmentReason } from "../db/schema.js";

// Point unique pour assigner/réassigner une conversation : met à jour l'état courant ET
// journalise l'historique (email_assignments), utilisé aussi bien par le routing
// automatique (§6) que par les actions manuelles s'assigner/transférer (§7).
export async function assignConversation(params: {
  conversationId: string;
  assignedToUserId: string;
  assignedByUserId: string | null;
  reason: AssignmentReason;
}) {
  await db
    .update(emailConversations)
    .set({
      assignedUserId: params.assignedToUserId,
      status: "EN_COURS",
      updatedAt: sql`(current_timestamp)`,
    })
    .where(eq(emailConversations.id, params.conversationId));

  await db.insert(emailAssignments).values({
    id: randomUUID(),
    conversationId: params.conversationId,
    assignedToUserId: params.assignedToUserId,
    assignedByUserId: params.assignedByUserId,
    reason: params.reason,
  });
}
