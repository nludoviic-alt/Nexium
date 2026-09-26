# Déploiement — send-email

Cette Edge Function ne se déploie PAS automatiquement via le pipeline GitHub Actions
(celui-ci ne gère que le site statique). Elle doit être déployée une fois, manuellement,
depuis Supabase — puis le secret `RESEND_API_KEY` doit être configuré.

## Pourquoi cette fonction existe

Avant, `src/lib/resend.ts` appelait `https://api.resend.com/emails` **directement depuis
le navigateur**, avec la clé API Resend (`VITE_RESEND_API_KEY`) embarquée en clair dans
le JavaScript public du site. N'importe quel visiteur pouvait la récupérer (DevTools) et
l'utiliser pour envoyer des e-mails au nom du domaine. Cette fonction sert de relais
serveur : le client lui envoie `{to, subject, html}`, elle seule connaît la clé Resend
(stockée comme secret de fonction, jamais exposée) et fait l'appel réel à Resend.

```
Navigateur ──HTTPS (anon key)──▶ send-email (cette fonction) ──▶ api.resend.com (clé secrète)
```

## 1. Déployer la fonction

### Option A — Depuis le Dashboard Supabase (sans CLI, recommandé)

1. Supabase Studio → **Edge Functions** → **Deploy a new function**.
2. Nom : `send-email`.
3. Colle le contenu de `index.ts` (ce dossier).
4. Déployer.

### Option B — Via la CLI Supabase

```bash
supabase login
supabase link --project-ref <ton-project-ref>
supabase functions deploy send-email
```

## 2. Configurer le secret Resend (obligatoire)

Sans ce secret, la fonction répond `{"success":false,"error":"not_configured"}` et
tous les e-mails échouent.

### Dashboard

Project Settings → Edge Functions → Secrets → **Add secret** :
- `RESEND_API_KEY` = ta clé API Resend (commence par `re_`)
- `RESEND_FROM_EMAIL` (optionnel) = adresse d'expédition par défaut, ex.
  `Nexium Markets <support@nexiummarkets.com>`

### CLI

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
supabase secrets set RESEND_FROM_EMAIL="Nexium Markets <support@nexiummarkets.com>"
```

## 3. Retirer l'ancienne clé exposée

`VITE_RESEND_API_KEY` n'est plus utilisée par le client — supprime-la de tes secrets
GitHub Actions et de tes `.env` une fois cette fonction déployée et vérifiée, et
**régénère la clé côté Resend** (Dashboard Resend → API Keys) puisque l'ancienne a
circulé publiquement dans le bundle du site déployé.

## Contrôle d'accès

La fonction n'est pas un relais ouvert : elle identifie l'appelant à partir du jeton
`Authorization` (vérifié avec `SUPABASE_SERVICE_ROLE_KEY`, fourni automatiquement aux
Edge Functions).

| Appelant | Destinataires autorisés | Limite |
| :--- | :--- | :--- |
| Staff actif (OWNER … QUANT, statut `ACTIVE`) | tous | aucune |
| Client connecté | boîte interne ou sa propre adresse | 10 envois / heure |
| Visiteur anonyme (clé anon/publishable) | boîte interne uniquement | 10 envois / heure / IP |

- Boîte interne : secret optionnel `INTERNAL_NOTIFICATION_EMAILS` (liste séparée par des
  virgules), par défaut `support@nexiummarkets.com`.
- `to` doit être une seule adresse (chaîne), jamais un tableau.
- L'expéditeur est toujours `RESEND_FROM_EMAIL` (ou le défaut) : le champ `from` envoyé
  par le client est ignoré.
- Les compteurs utilisent la table `contact_rate_limits` avec une clé préfixée
  `send-email:` (hachée), distincte de celle du formulaire de contact.

## Vérification

```bash
# Anonyme vers la boîte interne : autorisé
curl -X POST "https://<project-ref>.supabase.co/functions/v1/send-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VITE_SUPABASE_ANON_KEY>" \
  -d '{"to":"support@nexiummarkets.com","subject":"Test","html":"<p>Test send-email</p>"}'
```

Réponse attendue : `{"success":true,"id":"..."}`. La même requête vers une autre adresse
doit répondre `403 {"success":false,"error":"recipient_not_allowed"}`.
