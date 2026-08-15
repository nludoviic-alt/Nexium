import { createServer } from "./server.js";
import { env, isOvhConfigured } from "./lib/env.js";
import { syncInbox } from "./lib/imap.js";

const app = createServer();

app.listen(env.PORT, () => {
  console.log(`[email-service] Écoute sur http://localhost:${env.PORT}`);
  console.log(isOvhConfigured ? "[email-service] OVH configuré — synchro IMAP active." : "[email-service] OVH non configuré — synchro IMAP en attente (voir .env).");
});

// §13 : boucle de synchro interne, alternative à un cron externe. Si vous préférez un
// cron système (crontab) qui appelle POST /api/sync, mettez SYNC_INTERVAL_SECONDS à une
// valeur très haute ou retirez ce bloc — les deux mécanismes sont idempotents et peuvent
// cohabiter sans risque de doublons.
if (isOvhConfigured) {
  setInterval(() => {
    syncInbox().catch((err) => console.error("[email-service] Erreur de synchro périodique :", err));
  }, env.SYNC_INTERVAL_SECONDS * 1000);
}
