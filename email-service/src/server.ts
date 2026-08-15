import express from "express";
import cors from "cors";
import { env } from "./lib/env.js";
import { requireApiSecret, requireAgent } from "./middleware/auth.js";
import { conversationsRouter } from "./routes/conversations.js";
import { messagesRouter } from "./routes/messages.js";
import { notesRouter } from "./routes/notes.js";
import { attachmentsRouter } from "./routes/attachments.js";
import { agentsRouter } from "./routes/agents.js";
import { syncRouter } from "./routes/sync.js";

export function createServer() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // §16 : toutes les routes du module E-mails vérifient (1) le secret de service puis
  // (2) l'identité de l'agent, avant tout accès aux données.
  app.use("/api", requireApiSecret, requireAgent);
  app.use("/api", conversationsRouter);
  app.use("/api", messagesRouter);
  app.use("/api", notesRouter);
  app.use("/api", attachmentsRouter);
  app.use("/api", agentsRouter);
  app.use("/api", syncRouter);

  // Filet de sécurité générique — ne jamais renvoyer la stack/les détails internes au
  // client (§16), tout va dans les logs serveur.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[server] Erreur non gérée :", err);
    res.status(500).json({ error: "internal_error" });
  });

  return app;
}
