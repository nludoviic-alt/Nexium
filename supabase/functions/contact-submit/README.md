# Déploiement — contact-submit

Cette Edge Function ne se déploie PAS automatiquement via le pipeline GitHub Actions
existant (celui-ci ne gère que le site statique). Elle doit être déployée une fois,
manuellement, depuis Supabase.

## Option A — Depuis le Dashboard Supabase (sans CLI, recommandé)

1. Supabase Studio → **Edge Functions** → **Deploy a new function**.
2. Nom : `contact-submit`.
3. Colle le contenu de `index.ts` (ce dossier).
4. Déployer.
5. Aucun secret à ajouter manuellement : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
   sont automatiquement disponibles pour toute Edge Function du projet.

## Option B — Via la CLI Supabase

```bash
supabase login
supabase link --project-ref <ton-project-ref>
supabase functions deploy contact-submit
```

## Vérification

Une fois déployée, teste avec :

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/contact-submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VITE_SUPABASE_ANON_KEY>" \
  -d '{"honeypot":"","elapsedSeconds":5}'
```

Réponse attendue : `{"allowed":true}`.

Tant qu'elle n'est pas déployée, le formulaire de contact continue de fonctionner
normalement (la vérification est en *fail-open* : une fonction absente ou injoignable
ne bloque jamais un client légitime).
