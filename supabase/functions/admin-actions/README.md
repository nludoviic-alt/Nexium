# Edge Function : admin-actions

Cette fonction Supabase gère de manière sécurisée les opérations d'administration privilégiées qui requièrent la clé `service_role` (invitation d'utilisateurs, mise à jour des e-mails, réinitialisation de mot de passe, déconnexion forcée).

## Déploiement

```bash
supabase functions deploy admin-actions
```

## Secrets nécessaires

Les secrets `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement par Supabase dans l'environnement d'exécution de la fonction.

Variable optionnelle :
- `INVITE_REDIRECT_URL` (défaut : `https://nexiummarkets.com/reset-password`)
