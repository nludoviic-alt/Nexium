import type { AuthedAgent } from "../middleware/auth.js";
import { isAdminTier } from "../middleware/auth.js";
import type { emailConversations } from "../db/schema.js";

type Conversation = typeof emailConversations.$inferSelect;

// §15 : ADMIN voit/gère tout. AGENT voit la boîte partagée (comme tout centre de
// contact collaboratif) mais ne peut agir (répondre/note/statut) que sur ses propres
// conversations, celles non assignées (auto-claim), ou avec permission de transfert.
export function canViewConversation(_agent: AuthedAgent, _conversation: Conversation): boolean {
  return true; // boîte de réception partagée en lecture pour tous les agents authentifiés
}

export function canActOnConversation(agent: AuthedAgent, conversation: Conversation): boolean {
  if (isAdminTier(agent.role)) return true;
  if (conversation.assignedUserId === agent.id) return true;
  if (conversation.assignedUserId === null) return true; // peut se l'auto-assigner en répondant
  return false;
}

export function canTransfer(agent: AuthedAgent, conversation: Conversation, agentCanTransferFlag: boolean): boolean {
  if (isAdminTier(agent.role)) return true;
  return agentCanTransferFlag && conversation.assignedUserId === agent.id;
}

export function canReassignFreely(agent: AuthedAgent): boolean {
  return isAdminTier(agent.role);
}
