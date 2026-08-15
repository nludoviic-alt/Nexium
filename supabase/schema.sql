-- =====================================================================
-- NEXIUM MARKETS - SCHEMA DE BASE DE DONNÉES SUPABASE (POSTGRESQL)
-- =====================================================================
-- Ce script est idempotent : il peut être ré-exécuté sans danger sur une
-- base existante (CREATE ... IF NOT EXISTS, DROP POLICY/CONSTRAINT IF
-- EXISTS avant recréation). À exécuter depuis Supabase Studio → SQL
-- Editor, ou via `supabase db push` si le projet est lié en CLI.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE : PROFILES (Profils Utilisateurs & Administrateurs)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'TRADER' CHECK (role IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT', 'FINANCE', 'QUANT', 'TRADER')),
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    kyc_status TEXT NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (kyc_status IN ('VERIFIED', 'PENDING', 'REJECTED', 'NOT_SUBMITTED')),
    mt5_login TEXT,
    mt5_broker TEXT DEFAULT 'Nexium ECN Live',
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    gross_profit_total NUMERIC(14, 2) DEFAULT 0.00,
    gross_loss_total NUMERIC(14, 2) DEFAULT 0.00,
    assigned_advisor TEXT DEFAULT 'Dr. Antoine R.',
    license_status TEXT DEFAULT 'NOT_REQUESTED' CHECK (license_status IN ('NOT_REQUESTED', 'PENDING_PRESET_APPROVAL', 'ACTIVE', 'EXPIRED')),
    requested_preset TEXT,
    active_preset TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colonnes ajoutées après la première mise en production (safe sur une table existante) :
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'NOT_REQUESTED';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requested_preset TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_preset TEXT;

-- Super Owner : au plus un seul profil peut porter ce statut (imposé par
-- l'index unique partiel ci-dessous). Ce compte est protégé au niveau du
-- trigger `protect_privileged_profile_fields` — personne, pas même un autre
-- OWNER, ne peut modifier son rôle/statut ni le supprimer depuis l'app.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_primary_owner BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_single_primary_owner
    ON public.profiles (is_primary_owner)
    WHERE is_primary_owner;

-- Le statut PENDING_APPROVAL manquait de la contrainte d'origine : le portail de
-- validation manuelle admin était de fait inopérant (l'upsert d'inscription
-- échouait en silence). On recrée la contrainte avec la valeur manquante.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'BANNED', 'REVOKED'));

-- Le défaut d'origine était 'ACTIVE' : un profil créé sans statut explicite
-- se retrouvait actif sans jamais passer par la validation manuelle.
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'PENDING_APPROVAL';

-- balance ne doit jamais être NULL (comparaisons "= 0" utilisées par la policy
-- d'inscription ci-dessous) — on nettoie l'existant avant de contraindre.
UPDATE public.profiles SET balance = 0 WHERE balance IS NULL;
ALTER TABLE public.profiles ALTER COLUMN balance SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN balance SET DEFAULT 0.00;

-- 3. TABLE : MT5_ACCOUNTS & STRATÉGIES IA
CREATE TABLE IF NOT EXISTS public.mt5_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    login_id TEXT NOT NULL UNIQUE,
    broker TEXT NOT NULL DEFAULT 'Nexium Prime ECN',
    server_name TEXT NOT NULL DEFAULT 'Nexium-NY4-Equinix',
    leverage INTEGER NOT NULL DEFAULT 500,
    ai_gold_active BOOLEAN DEFAULT TRUE,
    fx_trend_active BOOLEAN DEFAULT TRUE,
    index_reversion_active BOOLEAN DEFAULT FALSE,
    max_daily_loss_percent NUMERIC(5, 2) DEFAULT 4.50,
    max_drawdown_percent NUMERIC(5, 2) DEFAULT 8.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE : TRANSACTIONS (Dépôts, Retraits, Performance Fees)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'PERF_FEE', 'TRADE_PROFIT', 'BONUS')),
    amount NUMERIC(14, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED', 'REJECTED')),
    method TEXT,
    reference_tx TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE : CHAT_MESSAGES (Messagerie Directe Client ↔ Desk)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('CLIENT', 'DESK', 'AI', 'SYSTEM')),
    sender_name TEXT NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    channel TEXT NOT NULL DEFAULT 'CHAT' CHECK (channel IN ('CHAT', 'EMAIL')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE : AUDIT_LOGS (Journal Immuable des Actions Administrateurs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user_id TEXT,
    target_user_email TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FONCTION DE SÉCURITÉ POUR ÉVITER LA RÉCURSION RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 8. PROTECTION DES COLONNES SENSIBLES DE PROFILES ET DU SUPER OWNER
-- Avant cette fonction, la policy RLS "FOR ALL USING (auth.uid() = id OR ...)"
-- laissait un client modifier SA PROPRE ligne sans aucune restriction de
-- colonne : un simple `update({ role: 'OWNER', status: 'ACTIVE', balance: 999999 })`
-- depuis le navigateur suffisait à s'auto-promouvoir administrateur. Ce trigger
-- réécrit silencieusement les colonnes sensibles à leur valeur précédente
-- lorsque l'appelant n'est pas déjà membre du staff, et applique en plus deux
-- règles propres au Super Owner :
--   1. Personne d'autre que le Super Owner ne peut attribuer le rôle OWNER.
--   2. La ligne du Super Owner (is_primary_owner = true) est verrouillée
--      pour tout le monde, y compris pour lui-même via l'app — seule une
--      requête SQL directe peut la modifier.
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_primary_owner BOOLEAN;
BEGIN
  -- auth.uid() est NULL en dehors d'une requête PostgREST authentifiée —
  -- c'est-à-dire uniquement pour une connexion directe privilégiée (SQL
  -- Editor Supabase Studio, `supabase db push`, connexion service_role).
  -- La RLS bloque déjà tout appelant anonyme/non authentifié avant même
  -- d'atteindre ce trigger (auth.uid() = id ne peut jamais matcher pour un
  -- appelant sans JWT), donc ce cas ne peut être atteint que par quelqu'un
  -- disposant déjà des identifiants de la base — on le laisse passer sans
  -- restriction, c'est le canal légitime pour le bootstrap du Super Owner.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_primary_owner INTO caller_is_primary_owner FROM public.profiles WHERE id = auth.uid();
  caller_is_primary_owner := COALESCE(caller_is_primary_owner, FALSE);

  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'OWNER' AND NOT caller_is_primary_owner THEN
      RAISE EXCEPTION 'Seul le Super Owner peut attribuer le rôle OWNER.';
    END IF;
    IF NEW.is_primary_owner AND NOT caller_is_primary_owner THEN
      RAISE EXCEPTION 'Le statut de Super Owner ne peut être attribué que manuellement en base.';
    END IF;
    RETURN NEW;
  END IF;

  -- À partir d'ici TG_OP = 'UPDATE', OLD est disponible.
  IF NEW.role = 'OWNER' AND NEW.role IS DISTINCT FROM OLD.role AND NOT caller_is_primary_owner THEN
    RAISE EXCEPTION 'Seul le Super Owner peut attribuer le rôle OWNER.';
  END IF;

  IF NEW.is_primary_owner AND NOT OLD.is_primary_owner AND NOT caller_is_primary_owner THEN
    RAISE EXCEPTION 'Le statut de Super Owner ne peut être attribué que manuellement en base.';
  END IF;

  IF OLD.is_primary_owner THEN
    -- Verrou total : ni un autre OWNER, ni le Super Owner lui-même depuis
    -- l'app, ne peuvent changer ces colonnes sur SA PROPRE ligne protégée.
    NEW.role := OLD.role;
    NEW.status := OLD.status;
    NEW.kyc_status := OLD.kyc_status;
    NEW.is_primary_owner := OLD.is_primary_owner;
    NEW.balance := OLD.balance;
    NEW.gross_profit_total := OLD.gross_profit_total;
    NEW.gross_loss_total := OLD.gross_loss_total;
    NEW.mt5_login := OLD.mt5_login;
    NEW.mt5_broker := OLD.mt5_broker;
    NEW.assigned_advisor := OLD.assigned_advisor;
    NEW.license_status := OLD.license_status;
    NEW.active_preset := OLD.active_preset;
    RETURN NEW;
  END IF;

  IF public.get_my_role() NOT IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER') THEN
    NEW.role := OLD.role;
    NEW.status := OLD.status;
    NEW.kyc_status := OLD.kyc_status;
    NEW.balance := OLD.balance;
    NEW.gross_profit_total := OLD.gross_profit_total;
    NEW.gross_loss_total := OLD.gross_loss_total;
    NEW.mt5_login := OLD.mt5_login;
    NEW.mt5_broker := OLD.mt5_broker;
    NEW.assigned_advisor := OLD.assigned_advisor;
    NEW.license_status := OLD.license_status;
    NEW.active_preset := OLD.active_preset;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_privileged_profile_fields
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_privileged_profile_fields();

-- 9. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt5_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anciennes policies (héritées d'un unique "FOR ALL" par table, sans
-- distinction lecture/écriture — c'est ce qui permettait l'auto-élévation
-- de privilèges décrite ci-dessus).
DROP POLICY IF EXISTS "Lecture profil par propriétaire ou admin" ON public.profiles;
DROP POLICY IF EXISTS "Lecture transactions utilisateur" ON public.transactions;
DROP POLICY IF EXISTS "Lecture messages chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Lecture journal audit par Direction" ON public.audit_logs;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_staff_write" ON public.transactions;
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

-- --- PROFILES ---------------------------------------------------------
-- Lecture : le propriétaire ou le staff.
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER'));

-- Création : le staff peut créer n'importe quel profil ; un client ne peut
-- créer QUE le sien, et uniquement avec les valeurs par défaut d'un compte
-- non approuvé (impossible de s'auto-créer OWNER ou avec un solde positif).
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (
        public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN')
        OR (
            auth.uid() = id
            AND role = 'TRADER'
            AND status = 'PENDING_APPROVAL'
            AND kyc_status IN ('PENDING', 'NOT_SUBMITTED')
            AND balance = 0
        )
    );

-- Mise à jour : le propriétaire ou le staff peut lancer l'UPDATE, mais le
-- trigger ci-dessus neutralise les colonnes sensibles si l'appelant n'est
-- pas staff — la policy autorise large, le trigger protège fin.
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER'))
    WITH CHECK (auth.uid() = id OR public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER'));

-- Suppression : réservée à la Direction, jamais sur la ligne du Super Owner.
CREATE POLICY "profiles_delete" ON public.profiles
    FOR DELETE USING (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN') AND NOT is_primary_owner);

-- --- TRANSACTIONS -------------------------------------------------------
-- Lecture : le titulaire du compte ou le staff financier.
CREATE POLICY "transactions_select" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id OR public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'FINANCE'));

-- Écriture (création/modification/suppression) : réservée au staff. Un
-- client ne peut plus s'auto-créditer un dépôt fictif.
CREATE POLICY "transactions_staff_write" ON public.transactions
    FOR ALL USING (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'FINANCE'))
    WITH CHECK (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'FINANCE'));

-- --- CHAT_MESSAGES --------------------------------------------------------
-- Non modifié dans cette passe (table non utilisée par le code actuel — le
-- module Messagerie de /composition fonctionne encore sur des données de
-- démonstration). À durcir sur le même modèle que profiles/transactions
-- avant sa mise en production réelle.
DROP POLICY IF EXISTS "Lecture messages chat" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_all" ON public.chat_messages;
CREATE POLICY "chat_messages_all" ON public.chat_messages
    FOR ALL USING (auth.uid() = client_id OR public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT'));

-- --- AUDIT_LOGS ---------------------------------------------------------
-- Lecture : réservée à la Direction (immuabilité du journal).
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN'));

-- Écriture : le staff peut journaliser ses propres actions ; un client tout
-- juste inscrit peut UNIQUEMENT insérer l'entrée "CLIENT_REGISTERED" qui le
-- concerne lui-même (admin_id = target_user_id = son propre auth.uid()) —
-- impossible de fabriquer une entrée arbitraire ou au nom d'un tiers.
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (
        public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT', 'FINANCE', 'QUANT')
        OR (action = 'CLIENT_REGISTERED' AND admin_id = auth.uid()::text AND target_user_id = auth.uid()::text)
    );
