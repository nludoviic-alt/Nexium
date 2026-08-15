# email-service

Service backend dédié au module **E-mails** de l'admin Nexium — boîte OVH partagée
(`contact@mondomaine.com`), IMAP/SMTP, routing automatique, assignation, pièces jointes.

## Pourquoi un service séparé ?

Le site principal (`src/`, à la racine du repo) est **buildé en statique** et déployé par
FTP (`vite.config.ts` : `nitro: false`). Un site statique ne peut exécuter aucun code
serveur — pas de base de données, pas de connexion IMAP/SMTP persistante, pas de secret
caché. Ce service tourne donc **séparément, sur votre VPS**, et le dashboard admin (page
"E-mails") lui parle en HTTPS.

```
Admin (statique, FTP) ──HTTPS──▶ email-service (Node, ce dossier) ──▶ SQLite + IMAP/SMTP OVH
```

## 1. Installation

```bash
cd email-service
npm install
cp .env.example .env
```

Éditez `.env` :
- `API_SHARED_SECRET` — générez-en un vrai : `openssl rand -hex 32`
- `CORS_ORIGIN` — l'URL du dashboard admin en production
- Laissez les variables OVH (`EMAIL_ADDRESS`, `EMAIL_PASSWORD`, `IMAP_HOST`, `SMTP_HOST`,
  …) vides tant que la config OVH n'est pas prête — le service démarre quand même,
  IMAP/SMTP no-opent proprement avec un avertissement dans les logs.

## 2. Base de données

```bash
npm run db:generate   # génère la migration SQL à partir du schéma (déjà fait, à relancer si vous éditez src/db/schema.ts)
npm run db:migrate    # applique les migrations
npm run seed          # crée les 6 agents (mêmes ids que INITIAL_STAFF côté admin) + 3 conversations de démo
```

## 3. Lancer en local

```bash
npm run dev
```

Écoute sur `http://localhost:4100` (configurable via `PORT`). Dans le frontend, mettez
`VITE_EMAIL_API_URL=http://localhost:4100` et `VITE_EMAIL_API_KEY=<API_SHARED_SECRET>`
dans un `.env.local` à la racine du projet (voir `.env.example` racine).

## 4. Déploiement sur le VPS

```bash
npm run build
npm run start   # node dist/index.js
```

Recommandé : faire tourner ça sous un gestionnaire de process (PM2, systemd) pour qu'il
redémarre automatiquement.

Exemple PM2 :
```bash
pm2 start dist/index.js --name email-service
pm2 save
```

N'exposez que le port choisi derrière un reverse-proxy HTTPS (nginx/Caddy) — ne mettez
jamais ce service directement sur Internet en HTTP nu.

## 5. Synchronisation IMAP

Deux options, non exclusives (les deux sont idempotentes, aucun risque de doublon) :

- **Boucle interne** (par défaut si OVH est configuré) : `SYNC_INTERVAL_SECONDS` dans
  `.env` (60s par défaut).
- **Cron système**, si vous préférez découpler la synchro du process web :
  ```cron
  * * * * * curl -s -X POST https://votre-service/api/sync \
    -H "Authorization: Bearer <API_SHARED_SECRET>" \
    -H "x-user-id: adm-owner"
  ```
  (`/api/sync` est réservé aux rôles admin — voir `src/middleware/auth.ts`.)

## 6. Configuration OVH (à faire quand vous êtes prêt)

Dans `.env` :
```
EMAIL_ADDRESS=contact@mondomaine.com
EMAIL_PASSWORD=<mot de passe de la boîte OVH>
IMAP_HOST=ssl0.ovh.net   # à confirmer selon votre offre exacte
IMAP_PORT=993
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
```
Redémarrez le service après modification. Testez d'abord avec `npm run sync:once`
(synchro manuelle unique, logs détaillés) avant de compter sur la boucle automatique.

## 7. Sécurité — état actuel et limites connues

- **Pas d'authentification serveur réelle pour l'instant** (voir `src/middleware/auth.ts`
  — commentaires `TODO(auth réelle)`). Le service fait confiance à un header `x-user-id`
  envoyé par le frontend, exactement comme le sélecteur de rôle factice de
  `src/routes/admin.tsx` aujourd'hui. C'est un choix assumé le temps qu'une vraie
  authentification centrale existe pour tout le projet — **ne pas exposer ce service à
  des utilisateurs non session déjà en confiance**.
- Le mot de passe OVH ne vit que dans `.env` sur le VPS — jamais dans le frontend, jamais
  en base, jamais dans les logs.
- HTML des e-mails entrants assaini (DOMPurify) avant tout affichage, images distantes
  bloquées par défaut (anti-tracking).
- Pièces jointes : MIME + taille validés, noms de fichiers générés côté serveur (jamais
  dérivés d'une entrée utilisateur), stockage hors de tout dossier servi publiquement.
- Chaque route vérifie explicitement les permissions (assigné / admin / boîte partagée en
  lecture) — voir `src/lib/permissions.ts`.

## Structure

```
src/
  db/schema.ts       Schéma Drizzle (7 tables : accounts, agents, conversations,
                      messages, notes, attachments, assignments)
  lib/                imap.ts, smtp.ts, threading.ts, routing.ts, sanitize.ts,
                      attachments.ts, permissions.ts, assignment.ts, env.ts
  middleware/auth.ts  Secret API + identité agent (temporaire, voir §7)
  routes/             conversations, messages, notes, attachments, agents, sync
```
