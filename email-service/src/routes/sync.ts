import { Router } from "express";
import { requireAdminTier } from "../middleware/auth.js";
import { syncInbox } from "../lib/imap.js";
import { isOvhConfigured } from "../lib/env.js";

export const syncRouter = Router();

// §13 : déclenchement manuel/cron d'une passe de synchro IMAP. Réservé aux admins —
// évite qu'un agent déclenche des synchros à répétition sans raison.
syncRouter.post("/sync", requireAdminTier, async (_req, res) => {
  if (!isOvhConfigured) {
    return res.status(503).json({ error: "ovh_not_configured" });
  }
  try {
    const result = await syncInbox();
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("[sync] Échec :", err);
    res.status(500).json({ error: "sync_failed" });
  }
});
