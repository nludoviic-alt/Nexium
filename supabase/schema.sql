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
    assigned_advisor TEXT DEFAULT 'Expert Trading',
    license_status TEXT DEFAULT 'NOT_REQUESTED' CHECK (license_status IN ('NOT_REQUESTED', 'PENDING_PRESET_APPROVAL', 'ACTIVE', 'EXPIRED')),
    requested_preset TEXT,
    active_preset TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colonnes ajoutées après la première mise en production :
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'NOT_REQUESTED';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requested_preset TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_preset TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_primary_owner BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_single_primary_owner
    ON public.profiles (is_primary_owner)
    WHERE is_primary_owner;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'BANNED', 'REVOKED'));

ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'PENDING_APPROVAL';

UPDATE public.profiles SET balance = 0 WHERE balance IS NULL;
ALTER TABLE public.profiles ALTER COLUMN balance SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN balance SET DEFAULT 0.00;

-- Colonnes pour la gestion totale et réelle du profil client depuis /composition
-- (auparavant simulées en local uniquement : rien ne survivait au rechargement).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mt5_server TEXT DEFAULT 'Nexium-NY4-Equinix';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mt5_investor_pass TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_daily_loss_percent NUMERIC(5, 2) DEFAULT 3.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_simultaneous_trades INTEGER DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS risk_guard_auto_stop BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS engines_config JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_key TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_expires DATE;

-- Notes confidentielles du staff sur un client (CRM) — policy RLS définie
-- plus bas, section 11, une fois get_my_role() disponible.
CREATE TABLE IF NOT EXISTS public.crm_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'PERF_FEE', 'TRADE_PROFIT', 'BONUS', 'DEBIT', 'PROFIT_SHARE', 'PNL_ADJUST')),
    amount NUMERIC(14, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED', 'REJECTED')),
    method TEXT,
    reference_tx TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Élargissement du type autorisé après la mise en production initiale : la
-- console /composition envoie aussi des ajustements manuels DEBIT/PROFIT_SHARE/PNL_ADJUST.
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'PERF_FEE', 'TRADE_PROFIT', 'BONUS', 'DEBIT', 'PROFIT_SHARE', 'PNL_ADJUST'));

-- 5. TABLE : LIVE_CHAT_THREADS (Routeur Chatbot & File d'attente Prospects)
CREATE TABLE IF NOT EXISTS public.live_chat_threads (
    id TEXT PRIMARY KEY,
    visitor_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
    status TEXT NOT NULL DEFAULT 'QUEUE' CHECK (status IN ('QUEUE', 'ACTIVE', 'RESOLVED')),
    assigned_advisor TEXT,
    assigned_advisor_role TEXT,
    initial_query TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE : CHAT_MESSAGES (Messagerie Directe Client / Prospect ↔ Desk)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id TEXT REFERENCES public.live_chat_threads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('CLIENT', 'VISITOR', 'ADMIN', 'SYSTEM')),
    author_name TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'CHAT' CHECK (channel IN ('CHAT', 'EMAIL')),
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLES DU MODULE E-MAILS & SUPPORT COLLABORATIF
CREATE TABLE IF NOT EXISTS public.email_conversations (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'INBOX' CHECK (status IN ('INBOX', 'MINE', 'UNASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED')),
    assigned_agent_id TEXT,
    assigned_agent_name TEXT,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    preview TEXT,
    unread BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_messages (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    conversation_id TEXT NOT NULL REFERENCES public.email_conversations(id) ON DELETE CASCADE,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_notes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    conversation_id TEXT NOT NULL REFERENCES public.email_conversations(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    category TEXT DEFAULT 'SUPPORT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLE : AUDIT_LOGS (Journal Immuable des Actions Administrateurs)
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

-- 9. FONCTION DE SÉCURITÉ POUR ÉVITER LA RÉCURSION RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.am_i_primary_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_primary_owner FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

-- 10. PROTECTION DES COLONNES SENSIBLES DE PROFILES ET DU SUPER OWNER
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_primary_owner BOOLEAN;
BEGIN
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

  IF NEW.role = 'OWNER' AND NEW.role IS DISTINCT FROM OLD.role AND NOT caller_is_primary_owner THEN
    RAISE EXCEPTION 'Seul le Super Owner peut attribuer le rôle OWNER.';
  END IF;

  IF NEW.is_primary_owner AND NOT OLD.is_primary_owner AND NOT caller_is_primary_owner THEN
    RAISE EXCEPTION 'Le statut de Super Owner ne peut être attribué que manuellement en base.';
  END IF;

  IF OLD.is_primary_owner THEN
    NEW.role := OLD.role;
    NEW.status := OLD.status;
    NEW.kyc_status := OLD.kyc_status;
    NEW.is_primary_owner := OLD.is_primary_owner;
    NEW.balance := OLD.balance;
    NEW.gross_profit_total := OLD.gross_profit_total;
    NEW.gross_loss_total := OLD.gross_loss_total;
    NEW.mt5_login := OLD.mt5_login;
    NEW.mt5_broker := OLD.mt5_broker;
    NEW.mt5_server := OLD.mt5_server;
    NEW.mt5_investor_pass := OLD.mt5_investor_pass;
    NEW.assigned_advisor := OLD.assigned_advisor;
    NEW.license_status := OLD.license_status;
    NEW.active_preset := OLD.active_preset;
    NEW.max_daily_loss_percent := OLD.max_daily_loss_percent;
    NEW.max_simultaneous_trades := OLD.max_simultaneous_trades;
    NEW.risk_guard_auto_stop := OLD.risk_guard_auto_stop;
    NEW.engines_config := OLD.engines_config;
    NEW.license_key := OLD.license_key;
    NEW.license_expires := OLD.license_expires;
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
    NEW.mt5_server := OLD.mt5_server;
    NEW.mt5_investor_pass := OLD.mt5_investor_pass;
    NEW.assigned_advisor := OLD.assigned_advisor;
    NEW.license_status := OLD.license_status;
    NEW.active_preset := OLD.active_preset;
    NEW.max_daily_loss_percent := OLD.max_daily_loss_percent;
    NEW.max_simultaneous_trades := OLD.max_simultaneous_trades;
    NEW.risk_guard_auto_stop := OLD.risk_guard_auto_stop;
    NEW.engines_config := OLD.engines_config;
    NEW.license_key := OLD.license_key;
    NEW.license_expires := OLD.license_expires;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_privileged_profile_fields
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_privileged_profile_fields();

-- 11. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt5_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

-- Politiques PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER'));

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

CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER'))
    WITH CHECK (auth.uid() = id OR public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER'));

-- Suppression : jamais le Super Owner. Un OWNER/SUPER_ADMIN peut supprimer
-- n'importe quel profil SAUF un autre OWNER — seul le Super Owner peut
-- supprimer un compte OWNER (protection de souveraineté).
CREATE POLICY "profiles_delete" ON public.profiles
    FOR DELETE USING (
        NOT is_primary_owner
        AND (
            (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN') AND role <> 'OWNER')
            OR public.am_i_primary_owner()
        )
    );

-- Politiques TRANSACTIONS
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_client" ON public.transactions;
DROP POLICY IF EXISTS "transactions_staff_write" ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id OR public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'FINANCE'));

-- Les clients peuvent créer leurs propres demandes de dépôt et de retrait (statut PENDING imposé)
CREATE POLICY "transactions_insert_client" ON public.transactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND status = 'PENDING'
        AND type IN ('DEPOSIT', 'WITHDRAWAL')
    );

CREATE POLICY "transactions_staff_write" ON public.transactions
    FOR ALL USING (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'FINANCE'))
    WITH CHECK (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'FINANCE'));

-- Politiques LIVE_CHAT_THREADS (Accessible aux visiteurs et au staff)
DROP POLICY IF EXISTS "live_chat_threads_select" ON public.live_chat_threads;
DROP POLICY IF EXISTS "live_chat_threads_insert" ON public.live_chat_threads;
DROP POLICY IF EXISTS "live_chat_threads_update" ON public.live_chat_threads;

CREATE POLICY "live_chat_threads_select" ON public.live_chat_threads
    FOR SELECT USING (true);

CREATE POLICY "live_chat_threads_insert" ON public.live_chat_threads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "live_chat_threads_update" ON public.live_chat_threads
    FOR UPDATE USING (true) WITH CHECK (true);

-- Politiques CHAT_MESSAGES
DROP POLICY IF EXISTS "chat_messages_all" ON public.chat_messages;
CREATE POLICY "chat_messages_all" ON public.chat_messages
    FOR ALL USING (true) WITH CHECK (true);

-- Politiques MODULE E-MAILS
DROP POLICY IF EXISTS "email_conversations_all" ON public.email_conversations;
CREATE POLICY "email_conversations_all" ON public.email_conversations
    FOR ALL USING (
        public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT')
        OR customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (
        public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT')
        OR customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "email_messages_all" ON public.email_messages;
CREATE POLICY "email_messages_all" ON public.email_messages
    FOR ALL USING (
        public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT')
        OR EXISTS (
            SELECT 1 FROM public.email_conversations
            WHERE id = conversation_id AND customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    )
    WITH CHECK (
        public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT')
        OR EXISTS (
            SELECT 1 FROM public.email_conversations
            WHERE id = conversation_id AND customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "email_notes_all" ON public.email_notes;
CREATE POLICY "email_notes_all" ON public.email_notes
    FOR ALL USING (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT'))
    WITH CHECK (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT'));

DROP POLICY IF EXISTS "email_templates_all" ON public.email_templates;
CREATE POLICY "email_templates_all" ON public.email_templates
    FOR ALL USING (true);

-- Politiques AUDIT_LOGS
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN'));

CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (
        public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT', 'FINANCE', 'QUANT')
        OR (action = 'CLIENT_REGISTERED' AND admin_id = auth.uid()::text AND target_user_id = auth.uid()::text)
    );

-- Politiques CRM_NOTES
DROP POLICY IF EXISTS "crm_notes_staff_all" ON public.crm_notes;
CREATE POLICY "crm_notes_staff_all" ON public.crm_notes
    FOR ALL USING (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT'))
    WITH CHECK (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT'));

-- 12. DÉCLENCHEUR AUTOMATIQUE INFAILLIBLE : CRÉATION DU PROFIL LORS DE L'INSCRIPTION AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_country TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_country := COALESCE(NEW.raw_user_meta_data->>'country', 'France');

  INSERT INTO public.profiles (
    id,
    email,
    name,
    country,
    role,
    status,
    kyc_status,
    balance,
    assigned_advisor
  ) VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_country,
    'TRADER',
    'PENDING_APPROVAL',
    'PENDING',
    0.00,
    'Desk de Conformité & Risque'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = CASE WHEN profiles.name = '' OR profiles.name IS NULL THEN EXCLUDED.name ELSE profiles.name END,
    country = CASE WHEN profiles.country IS NULL THEN EXCLUDED.country ELSE profiles.country END;

  -- Enregistrement automatique dans le journal d'audit
  INSERT INTO public.audit_logs (
    admin_id,
    admin_name,
    action,
    target_user_id,
    target_user_email,
    details
  ) VALUES (
    NEW.id::text,
    'Système Inscription',
    'CLIENT_REGISTERED',
    NEW.id::text,
    NEW.email,
    jsonb_build_object(
      'message', 'Nouvelle inscription enregistrée automatiquement par le trigger PostgreSQL',
      'name', v_name,
      'country', v_country
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. ACTIVATION SUPABASE REALTIME
-- Publication pour streaming WebSockets instantané des profils, transactions, messages et emails
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_messages;

