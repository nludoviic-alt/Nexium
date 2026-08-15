import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailAgents } from "../db/schema.js";
import { env } from "../lib/env.js";
import type { AgentRole } from "../db/schema.js";

export interface AuthedAgent {
  id: string;
  name: string;
  role: AgentRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      agent?: AuthedAgent;
    }
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Couche 1 : le frontend admin doit présenter le secret partagé. Ça bloque tout appel
// venant d'ailleurs que notre dashboard, mais ce n'est PAS une identité utilisateur.
export function requireApiSecret(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !safeEqual(token, env.API_SHARED_SECRET)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

// Couche 2 : identité de l'agent.
//
// TODO(auth réelle) : ceci fait confiance à des headers fournis par le client
// (x-user-id / x-user-role), exactement comme le sélecteur de rôle factice de
// src/routes/admin.tsx aujourd'hui. Un utilisateur malveillant qui a le secret API
// (ou un accès au navigateur d'un agent légitime) pourrait usurper un autre id. Ce
// n'est pas une vraie authentification — remplacer par une session serveur signée
// (cookie httpOnly + vérif JWT/DB) dès que l'auth centrale du projet existe, PUIS
// supprimer ce commentaire et le header x-user-role (le rôle doit alors venir de la
// session, jamais du client).
export async function requireAgent(req: Request, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "missing_user" });

  const [agent] = await db.select().from(emailAgents).where(eq(emailAgents.id, userId)).limit(1);
  if (!agent) return res.status(401).json({ error: "unknown_user" });

  req.agent = { id: agent.id, name: agent.name, role: agent.role };
  next();
}

const ADMIN_TIER: AgentRole[] = ["OWNER", "SUPER_ADMIN", "ADMIN"];

export function isAdminTier(role: AgentRole): boolean {
  return ADMIN_TIER.includes(role);
}

export function requireAdminTier(req: Request, res: Response, next: NextFunction) {
  if (!req.agent || !isAdminTier(req.agent.role)) {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}
