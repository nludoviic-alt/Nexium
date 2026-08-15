import { and, count, eq, ne } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAgents, emailConversations } from "../db/schema.js";

// §6 : routing volontairement simple — parmi les agents Disponibles, on choisit celui
// qui a le moins de conversations actives (tout statut sauf RESOLU). Aucun agent
// disponible => la conversation reste NON_ASSIGNE jusqu'à disponibilité ou assignation
// manuelle.
export async function pickLeastBusyAvailableAgent(): Promise<string | null> {
  const availableAgents = await db.select().from(emailAgents).where(eq(emailAgents.availability, "DISPONIBLE"));
  if (availableAgents.length === 0) return null;

  const loads = await Promise.all(
    availableAgents.map(async (agent) => {
      const [row] = await db
        .select({ n: count() })
        .from(emailConversations)
        .where(and(eq(emailConversations.assignedUserId, agent.id), ne(emailConversations.status, "RESOLU")));
      return { agentId: agent.id, load: row?.n ?? 0 };
    })
  );

  loads.sort((a, b) => a.load - b.load);
  return loads[0]?.agentId ?? null;
}
