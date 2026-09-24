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
   - **Solde Cash (`balance`)** : Ne revient jamais à 0 lors d'un rechargement. Initialisé immédiatement via `localStorage` (`nexium_demo_balance_local` / `nexium_demo_balance_{userId}`) puis réconcilié avec Supabase via `Math.max(dbBalance, storedBalance)`.
   - **Bonus Crédité (`bonus`, `bonus_credit`)** : Préservé à 100% lors des rafraîchissements. Synchronisé bidirectionnellement entre Supabase et `localStorage`.
   - **Gains des Presets (`goldTotalPnl`, `fxTotalPnl`, `indexTotalPnl`, `totalPresetPnl`)** : Conservés rigoureusement dans `quotaStats` (`goldPnl`, `fxPnl`, `indexPnl`). Tout gain de trade est sauvegardé en cache local et dans `engines_config.quota_stats` ainsi que `gross_profit_total`.
   - **Compteurs de Quota (`goldWins`, `fxWins`, `indexWins`)** : Conservés à travers les recharges. Ne sont réinitialisés **QUE** si l'administration a explicitement émis un nouveau `cycleId` différent du cycle précédent.
   - **Solde Terminal MT5 (`demoBalance`)** : Utilise une clé dédiée distincte (`nexium_demo_terminal_balance_{userId}`) pour éviter tout conflit ou écrasement croisé avec le solde cash réel du client.

2. **Élimination du Flash à Zéro (Lazy State Initialization)** :
   - Tous les hooks `useState` financiers (`balance`, `bonus`, `demoBalance`, `quotaStats`) utilisent une fonction d'initialisation fainéante (`useState(() => ...)`) lisant le cache local synchrone au premier rendu. Aucun affichage temporaire de `$0.00` ou de quota vide lors du chargement.

3. **Sauvegarde Immédiate sur Événements Métier** :
   - **Clôture de position (`handleClosePosition`)** : Met à jour immédiatement le solde via `handleLiveBalanceChange`, écrivant simultanément dans `localStorage` et dans la base Supabase.
   - **Écouteurs Realtime & Synchro Inter-onglets** : Tout changement de solde ou bonus reçu via Supabase Realtime ou l'événement `nexium_financial_update` est immédiatement répercuté dans le `localStorage` pour les rechargements futurs.
   - **Fusion protectrice anti-écrasement** : Aucun re-render de `useEffect` ne peut remplacer des quotas contenant des trades par un état vide (`EMPTY_QUOTA_STATS`). Les statistiques en mémoire et en cache sont fusionnées (`Math.max`).

---

## 6. Checklist de Contrôle Avant Déploiement

Avant chaque push ou mise en production, vérifier impérativement :
- [ ] `npm run build` compile sans aucune erreur TypeScript ou Vite.
- [ ] Une demande de prolongation pour un preset expiré affiche immédiatement `EN ATTENTE DE VALIDATION` avec le bouton bloqué en attente.
- [ ] L'approbation côté Desk Admin remet le quota à 0 et efface la demande en attente.
- [ ] Aucun libellé parasite "DÉMO" dans les notifications ou sur le Preset 1.
- [ ] Les gains s'additionnent correctement sur le solde total du client.
- [ ] **Préservation totale au rechargement (F5)** :
  - [ ] Le **bonus de compte** est préservé et ne revient jamais à 0.
  - [ ] Le **solde cash** (`balance`) est préservé et ne revient jamais à 0.
  - [ ] Les **gains des presets** (`totalPresetPnl`, `goldTotalPnl`, `fxTotalPnl`, `indexTotalPnl`) sont conservés.
  - [ ] Les **compteurs de trades/victoires** (`goldWins`, `fxWins`, `indexWins`) ne sont pas effacés.
  - [ ] **Zéro flash** à 0 grâce aux initialisateurs paresseux `useState(() => ...)`.
  - [ ] La clôture d'une position (`handleClosePosition`) persiste immédiatement le gain dans le `localStorage` et dans Supabase.
