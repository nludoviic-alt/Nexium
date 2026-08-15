import { Router } from "express";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAgents, emailConversations } from "../db/schema.js";
import type { AgentAvailability } from "../db/schema.js";

export const agentsRouter = Router();

// §6/§7 : liste des agents avec statut de disponibilité et charge active — utile pour
// l'UI "Assigné à X" / transfert.
agentsRouter.get("/agents", async (_req, res) => {
  const agents = await db.select().from(emailAgents);
  const withLoad = await Promise.all(
    agents.map(async (a) => {
      const [row] = await db
        .select({ n: count() })
        .from(emailConversations)
        .where(and(eq(emailConversations.assignedUserId, a.id), ne(emailConversations.status, "RESOLU")));
      return { ...a, activeConversations: row?.n ?? 0 };
    })
  );
  res.json({ agents: withLoad });
});

const VALID_AVAILABILITY: AgentAvailability[] = ["DISPONIBLE", "OCCUPE", "PAUSE", "HORS_LIGNE"];

// §6 : un agent change son propre statut (Disponible/Occupé/Pause/Hors ligne).
agentsRouter.patch("/agents/me/availability", async (req, res) => {
  const agent = req.agent!;
  const availability = req.body?.availability as AgentAvailability | undefined;
  if (!availability || !VALID_AVAILABILITY.includes(availability)) {
    return res.status(400).json({ error: "invalid_availability" });
  }
  await db.update(emailAgents).set({ availability }).where(eq(emailAgents.id, agent.id));
  res.json({ ok: true });
});
