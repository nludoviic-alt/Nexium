# NEXIUM MARKETS — Registre des Règles Métier & Résolutions Verrouillées

> **IMPORTANT : DOCUMENT DE RÉFÉRENCE ABSOLUE**  
> Ce fichier consigne l'ensemble des règles métier, des flux de validation et des corrections techniques validées sur Nexium Markets. Toute modification future doit impérativement respecter les règles énoncées ci-dessous afin d'éviter toute régression.

---

## 1. Cycle de Vie des Presets & Demandes de Validation

### A. Règle du Statut "EN ATTENTE DE VALIDATION"
Lorsqu'un client effectue une demande (activation initiale OU renouvellement/prolongation d'un preset arrivé à expiration) :
1. **Changement d'état immédiat et synchrone** :
   - Dès le clic sur le bouton ("Faire une nouvelle demande" ou "Demander l'activation"), le statut passe **instantanément** à `EN ATTENTE DE VALIDATION`.
   - La condition de détection de l'état `isPending` doit toujours couvrir les deux cas :
     ```ts
     const isRequested = (requestedPresets || []).includes(PRESET_KEY);
     const isPending = isRequested && (!isApproved || isExpired);
     ```
   - L'état `isPending` **doit être évalué avant** `isExpired` et `isApproved` pour l'affichage de l'interface.
2. **Indicateurs visuels obligatoires** :
   - **Badge d'en-tête** : Badge ambre clignotant `EN ATTENTE DE VALIDATION` avec icône spinner / point pulsant.
   - **Bouton d'action principal** : Désactivé (`disabled`, `opacity-90`, `cursor-not-allowed`) avec le texte :  
     `DEMANDE EN ATTENTE DE VALIDATION` (ou `EN COURS DE VALIDATION PAR LE DESK`).
   - Aucune carte de preset ne doit rester bloquée sur `EXPIRÉ (2/2)` ou afficher à nouveau le bouton cliquable tant que l'administration n'a pas traité la demande.
3. **Périmètre d'application** :
   - Cette règle s'applique de manière symétrique sur :
     - Les 3 cartes du **Terminal MT5 / Dashboard principal** (`src/routes/-nexium-dashboard.tsx`).
     - Les 3 cartes de l'onglet **"Configuration des Mises"** (`StakeManagementTab`).
4. **Persistance multi-niveaux (Résistance au rafraîchissement F5)** :
   - La demande est envoyée en base de données Supabase via `requestPresetsActivation(userId, nextRequested)`.
   - Elle est simultanément écrite dans le `localStorage` (`nexium_demo_requested_presets_${userId}`).
   - Au rechargement de la page (`useEffect` initial), l'application réconcilie les demandes en attente pour garantir que le statut reste `"EN ATTENTE DE VALIDATION"` même avant la réponse du serveur.

---

## 2. Validation & Réinitialisation par le Desk Admin (`composition.tsx`)

### A. Actions d'approbation et nouveau cycle
Le Super Administrateur dispose de 4 méthodes d'approbation :
1. `handleProlongSubscription` (Prolongation d'abonnement 1-clic pour tous les presets du client).
2. `handleNewTradingCycle` (Nouveau cycle individuel pour un preset spécifique).
3. `handleApproveSinglePreset` (Approbation et déverrouillage d'un preset individuel).
4. `handleApproveClientPreset` (Approbation collective des presets demandés).

### B. Effets verrouillés de toute approbation Admin
Chaque validation par l'administration exécute obligatoirement les 4 étapes suivantes :
1. **Remise à zéro des compteurs de quota** :
   - `goldWins = 0`, `goldPnl = 0` (idem pour `fxWins` et `indexWins`).
   - Génération d'un nouvel identifiant de cycle (`cycleId = new Date().toISOString()`).
   - Déverrouillage de la mise initiale (`delete quota.goldInitialStake`).
2. **Nettoyage de la liste des demandes** :
   - Le preset validé est **immédiatement retiré de `requested_presets`** dans Supabase (`requested_presets: []` ou exclusion du preset).
   - L'état local du Desk (`setClients`) est mis à jour pour refléter `requestedPresets` vidé.
3. **Mise à jour en temps réel chez le client** :
   - Grâce à Supabase Realtime (`subscribeToUserProfile`), le client reçoit la mise à jour en direct :
     - `requestedPresets` devient vide pour ce preset.
     - `quotaStats.goldWins` repasse à 0.
     - Le badge de statut bascule instantanément de `EN ATTENTE DE VALIDATION` à `ACTIF` (ou `EN PAUSE` selon l'état du bot).
4. **Envoi d'e-mail officiel** :
   - Envoi automatique de confirmation au client via Resend (`sendCustomDeskEmail`).

---

## 3. Suppression des Mentions "Démo"

1. **Preset 1 (Nexium AI Gold)** :
   - Présenté comme l'algorithme officiel certifié (or XAUUSD).
   - Aucune mention "DÉMO" n'apparaît sur le preset, ses cartes ou ses modales.
2. **Notifications & Emails Transactionnels** :
   - Les modèles d'emails de validation (`handleApproveClientPreset`, `handleProlongSubscription`, `handleNewTradingCycle`) confirment l'activation sur le **compte de trading**.
   - Suppression définitive des mentions du type *"compte de DÉMONSTRATION (trades simulés, sans effet sur votre solde réel)"*.

---

## 4. Paramètres, Quotas et Hiérarchie des Presets

| Preset | Sous-jacent | Plage de Mise | Gain par Trade | Quota par Cycle | Gain Max / Cycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Preset 1 : Nexium AI Gold** | XAUUSD | **$50 à $500** | **+50%** | **2 trades max** | **+100%** de la mise |
| **Preset 2 : Nexium FX Trend** | EURUSD | **$500 à $2,000** | **+75%** | **5 trades max** | **+375%** de la mise |
| **Preset 3 : Nexium Index Reversion** | NAS100 | **$2,000 à $10,000** | **+98%** | **Illimité (∞)** | Continu |

### Règle de Hiérarchie des Mises
- La mise du Preset 1 doit obligatoirement être inférieure à celle du Preset 2, elle-même inférieure à celle du Preset 3 :
  $$\text{Mise P1} < \text{Mise P2} < \text{Mise P3}$$
- La mise initiale choisie au départ du cycle est figée (`goldLockedStake`, etc.) pour le calcul des gains du cycle. Elle n'est modifiable qu'à l'ouverture du cycle suivant.

---

## 5. Intégrité & Persistance Absolue des Données Financières (Solde, Bonus, Gains & Quotas)

1. **Règle de Persistance Intégrale lors des Rechargements (F5)** :
   - **Solde Cash (`balance`)** : Initialisé immédiatement via `localStorage` (`nexium_demo_balance_local` / `nexium_demo_balance_{userId}`) pour éliminer tout flash à $0.00. Dès que la base Supabase est chargée, la valeur officielle du serveur est appliquée et enregistrée dans le cache local.
   - **Bonus Crédité (`bonus`, `bonus_credit`)** : Préservé lors des rafraîchissements et synchronisé avec Supabase.
   - **Gains des Presets (`goldTotalPnl`, `fxTotalPnl`, `indexTotalPnl`, `totalPresetPnl`)** : Conservés rigoureusement dans `quotaStats` (`goldPnl`, `fxPnl`, `indexPnl`). Tout gain de trade est sauvegardé en cache local et dans `engines_config.quota_stats` ainsi que `gross_profit_total`.
   - **Compteurs de Quota (`goldWins`, `fxWins`, `indexWins`)** : Conservés à travers les recharges. Ne sont réinitialisés **QUE** si l'administration a explicitement émis un nouveau `cycleId` différent du cycle précédent.
   - **Solde Terminal MT5 (`demoBalance`)** : Utilise une clé dédiée distincte (`nexium_demo_terminal_balance_{userId}`) pour éviter tout conflit ou écrasement croisé avec le solde cash réel du client.

2. **Application Immédiate des Pertes & Débits Administratifs** :
   - **Autorité de la Base de Données** : Les pertes appliquées par le Desk ("Ajustement P&L Perte (-)", débits, retraits) doivent **immédiatement impacter le compte client** en temps réel et au rechargement.
   - **Interdiction de `Math.max` bloquant** : Aucun `Math.max(dbBalance, storedBalance)` artificiel ne doit empêcher un solde ou un bonus de diminuer suite à une perte ou un débit validé par l'administration.
   - **Protection contre l'écrasement inversé** : Le dashboard client ne doit jamais renvoyer son ancien solde local à la base de données pour annuler une perte émise par le Desk.
   - **Propagation Complète de l'Ajustement P&L** : Toute perte appliquée via `handleApplyPnlAdjustment` met à jour simultanément :
     - `profiles.balance` et `profiles.engines_config.balance`.
     - `profiles.gross_loss_total` en base.
     - Le cache local `localStorage` du client.
     - L'événement global `nexium_financial_update` pour les autres onglets ouverts.

3. **Sauvegarde Immédiate sur Événements Métier** :
   - **Clôture de position (`handleClosePosition`)** : Met à jour immédiatement le solde via `handleLiveBalanceChange`, écrivant simultanément dans `localStorage` et dans la base Supabase.
   - **Écouteurs Realtime & Synchro Inter-onglets** : Tout changement de solde ou bonus reçu via Supabase Realtime ou l'événement `nexium_financial_update` est immédiatement répercuté dans l'état et le `localStorage`.
   - **Fusion protectrice anti-écrasement des quotas** : Les compteurs de victoires et P&L des presets ne sont jamais écrasés par un cycle vide tant qu'aucun nouveau cycle n'a été émis par le Desk.

---

## 6. Checklist de Contrôle Avant Déploiement

Avant chaque push ou mise en production, vérifier impérativement :
- [ ] `npm run build` compile sans aucune erreur TypeScript ou Vite.
- [ ] Une demande de prolongation pour un preset expiré affiche immédiatement `EN ATTENTE DE VALIDATION` avec le bouton bloqué en attente.
- [ ] L'approbation côté Desk Admin remet le quota à 0 et efface la demande en attente.
- [ ] Aucun libellé parasite "DÉMO" dans les notifications ou sur le Preset 1.
- [ ] Les gains s'additionnent correctement sur le solde total du client.
- [ ] **Application et Persistance des Pertes et Débits** :
  - [ ] Une perte appliquée depuis le Desk (`Ajustement Perte (-)`) diminue immédiatement le solde du client en temps réel.
  - [ ] Au rechargement (F5), la perte reste bien déduite et n'est pas réinitialisée ou annulée par le cache local.
  - [ ] Le client n'écrase pas la base de données avec son ancien solde pré-perte.
- [ ] **Préservation totale au rechargement (F5)** :
  - [ ] Le **bonus de compte** est préservé.
  - [ ] Le **solde cash** (`balance`) est préservé.
  - [ ] Les **gains des presets** (`totalPresetPnl`, `goldTotalPnl`, `fxTotalPnl`, `indexTotalPnl`) sont conservés.
  - [ ] Les **compteurs de trades/victoires** (`goldWins`, `fxWins`, `indexWins`) ne sont pas effacés.
  - [ ] **Zéro flash** à 0 grâce aux initialisateurs paresseux `useState(() => ...)`.
  - [ ] La clôture d'une position (`handleClosePosition`) persiste immédiatement le gain dans le `localStorage` et dans Supabase.

---

## 7. Architecture du Bonus Commercial (`bonus_credit`) — Règles Verrouillées

### A. Source de vérité et priorité de lecture (client dashboard)

Le bonus est résolu dans cet ordre de priorité dans `applyProfileToState` et le listener Realtime :
1. `profile.bonus_credit > 0` (colonne dédiée en base — source de vérité principale)
2. `(profile.engines_config as any)?.bonus_credit > 0` (fallback si colonne absente)
3. `(profile.engines_config as any)?.bonus > 0` (fallback bis)
4. `localStorage.getItem('nexium_demo_bonus_${userId}')` (cache local — dernier recours)

> **NE JAMAIS** simplifier cette logique en `profile.bonus_credit ?? 0`. Si la colonne vaut `null` ou `0`, les fallbacks doivent s'appliquer.

### B. Écriture du bonus par le Desk (`handleCreditOrDebit` dans `composition.tsx`)

Lors d'un crédit BONUS ou BONUS_DEBIT, les 3 écritures suivantes sont **obligatoires et simultanées** :
1. `updateUserProfile(userId, { bonus_credit: newBonus, balance: newBalance, engines_config: { ...existing, bonus_credit: newBonus, bonus: newBonus, balance: newBalance } })`
2. `localStorage.setItem('nexium_demo_bonus_${userId}', newBonus)`
3. `window.dispatchEvent(new CustomEvent('nexium_financial_update', { detail: { userId, balance, bonus: newBonus } }))`

### C. Bug critique résolu — Trigger PostgreSQL `protect_privileged_profile_fields` ⚠️

**PROBLÈME IDENTIFIÉ ET RÉSOLU le 2026-09-24** :

Le trigger `protect_privileged_profile_fields` (table `profiles`) forçait `NEW.bonus_credit := OLD.bonus_credit` pour tout rôle absent de la whitelist. Résultat : l'appel `updateUserProfile` retournait HTTP 200 (succès apparent) mais la base de données annulait silencieusement l'écriture du bonus.

**Règle verrouillée** : La whitelist du trigger ET la policy RLS `profiles_update` doivent toujours inclure :
```sql
'OWNER', 'OWNER_A_PLUS', 'OWNER_B_PLUS', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'FINANCE', 'SUPPORT'
```

**Ne jamais retirer `FINANCE` ou `SUPPORT` de cette liste** — ils ont besoin de modifier `balance`, `bonus_credit`, `gross_profit_total` et `gross_loss_total` pour leur travail opérationnel.

Migration appliquée : `supabase/migrations/20260924_fix_bonus_trigger_rls.sql`

### D. Protection du Super Owner (inchangée)

Si `OLD.is_primary_owner = TRUE`, **aucun** acteur extérieur (même OWNER) ne peut modifier ses champs financiers. Ce bloc est distinct et prioritaire sur la whitelist ci-dessus.

---

## 8. Sécurité des Comptes — Fonctionnalités VERROUILLÉES 🔒

> **Verrou actif.** Les règles ci-dessous ne doivent jamais être modifiées, contournées ni régressées. Un contrôle `pre-commit` (`.githooks/pre-commit`) refuse tout commit qui touche les fichiers ou blocs listés ici. Seul le propriétaire peut lever ce verrou, ponctuellement, avec son code personnel (`NEXIUM_UNLOCK=<code> git commit ...`).
>
> **Agents IA / développeurs** : ne jamais renseigner `NEXIUM_UNLOCK`, modifier `.githooks/`, changer `core.hooksPath`, utiliser `git commit --no-verify`, ni déplacer du code hors des balises `@nexium-lock-*` pour échapper au verrou — sauf si le propriétaire fournit lui-même le code dans la conversation pour ce changement précis.

### A. Création de compte client (activation par lien)
1. L'inscription (`src/routes/register.tsx`) appelle uniquement `supabase.auth.signUp`. **Aucun code OTP généré ou vérifié dans le navigateur.**
2. L'activation est imposée côté serveur par Supabase Auth (« Confirm email » activé, SMTP Resend). Tant que le lien n'est pas cliqué, la connexion est refusée.
3. Le profil (`TRADER`, solde 0) et la ligne d'audit `CLIENT_REGISTERED` sont créés **uniquement** par le trigger `handle_new_user`. Le navigateur n'écrit jamais dans `profiles` à l'inscription.
4. `getUserProfile` ne recrée **jamais** un profil manquant : un profil absent = compte supprimé → accès refusé.
5. La policy `profiles_insert` n'autorise **aucune** auto-insertion par un utilisateur (staff OWNER / A+ / B+ / SUPER_ADMIN / ADMIN uniquement).

### B. Envoi d'e-mails (`supabase/functions/send-email`)
1. Staff actif : tout destinataire. Client connecté : boîte interne ou sa propre adresse. Visiteur anonyme : boîte interne uniquement.
2. Un seul destinataire (chaîne), expéditeur imposé par le serveur, limite de fréquence pour les non-staff.
3. La clé Resend n'existe que comme secret de fonction (`RESEND_API_KEY`), jamais dans le code du site.

### C. Suppression / archivage de compte (`supabase/functions/manage-account`)
1. Toute suppression, tout archivage et toute restauration passent **exclusivement** par l'Edge Function `manage-account` (identifiants `auth.users` + profil + audit serveur). Aucun repli sur un `DELETE` direct de `profiles`.
2. **Client (TRADER) : suppression, archivage et restauration réservés au Super Owner.** Un ADMIN ne peut jamais supprimer un client.
3. Staff : suppression selon la hiérarchie Super Owner > Owner A+/B+ > Owner / Super Admin ; archivage/restauration réservés au Super Owner.
4. Personne ne peut agir sur le Super Owner ni sur son propre compte.
5. Archiver = connexion bloquée (ban Supabase Auth) + `status = 'ARCHIVED'`, **toutes les données conservées**. Seul le Super Owner fait entrer/sortir un compte de `ARCHIVED` (trigger `protect_archived_status`).
6. Migration de référence : `supabase/migrations/20260926_secure_account_deletion.sql`.

### D. Confirmation obligatoire du geste (Desk `composition.tsx`)
1. Suppression, archivage et restauration d'un client : fenêtre de confirmation avant exécution.
2. Modification d'une fiche client : « Enregistrer Réglages » ouvre une fenêtre récapitulant les champs modifiés ; rien n'est enregistré sans confirmation.

### E. Compte propriétaire
1. Le Super Owner (`nludoviic@gmail.com`) est **uniquement** un compte OWNER : pas d'espace client.
2. Tout compte du staff qui ouvre l'espace client (`/portal`) est renvoyé vers le Desk (hors « Supervision Live »).

### F. Création de compte par l'administration (`supabase/functions/create-account`)
1. Toute invitation (client ou staff) et toute attribution de rôle à un compte existant passent **exclusivement** par l'Edge Function `create-account` (droits et audit côté serveur).
2. **Seul le Super Owner attribue un rôle Owner** (OWNER, OWNER_A_PLUS, OWNER_B_PLUS).
3. Rôles attribuables : Super Owner → tous ; Owner A+/B+ → SUPER_ADMIN, ADMIN, CONSEILLER, SUPPORT, FINANCE, QUANT ; Owner / Super Admin → ADMIN, CONSEILLER, SUPPORT, FINANCE, QUANT ; autres rôles → aucun. Pour changer un rôle, il faut avoir autorité sur l'ancien ET le nouveau rôle. Personne ne change son propre rôle.
4. Ces règles sont imposées en base par le trigger `protect_role_changes` (migration `20260927_staff_role_hierarchy.sql`), même en cas d'appel API direct.
5. Compte existant : **jamais de promotion silencieuse**. Confirmation explicite obligatoire, statut inchangé (un compte banni le reste), la personne est prévenue par e-mail.
6. Le Super Owner n'est révélé qu'à lui-même : les autres membres du staff le voient comme un simple OWNER. Sa fiche n'est modifiable que par lui-même (trigger `protect_role_changes`).
7. Une action d'administration dont le service ne répond pas n'est **jamais** présentée comme réussie.

### G. Périmètre du verrou
- Fichiers entièrement verrouillés : `src/routes/register.tsx`, `src/routes/login.tsx`, `supabase/functions/send-email/index.ts`, `supabase/functions/manage-account/index.ts`, `supabase/migrations/20260926_secure_account_deletion.sql`, `.githooks/pre-commit`.
- Blocs balisés `@nexium-lock-start … @nexium-lock-end` : `src/lib/supabase.ts`, `src/routes/composition.tsx`, `src/routes/-nexium-dashboard.tsx`, `supabase/functions/create-account/index.ts`, `supabase/migrations/20260927_staff_role_hierarchy.sql`.
- Activation du verrou sur chaque clone : `git config core.hooksPath .githooks`.
