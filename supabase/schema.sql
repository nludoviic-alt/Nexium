-- =====================================================================
-- NEXIUM MARKETS - SCHEMA DE BASE DE DONNÉES SUPABASE (POSTGRESQL)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE : PROFILES (Profils Utilisateurs & Administrateurs)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'TRADER' CHECK (role IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT', 'FINANCE', 'QUANT', 'TRADER')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BANNED', 'REVOKED')),
    kyc_status TEXT NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (kyc_status IN ('VERIFIED', 'PENDING', 'REJECTED', 'NOT_SUBMITTED')),
    mt5_login TEXT,
    mt5_broker TEXT DEFAULT 'Nexium ECN Live',
    balance NUMERIC(14, 2) DEFAULT 0.00,
    gross_profit_total NUMERIC(14, 2) DEFAULT 0.00,
    gross_loss_total NUMERIC(14, 2) DEFAULT 0.00,
    assigned_advisor TEXT DEFAULT 'Dr. Antoine R.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- 7. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mt5_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simples
CREATE POLICY "Lecture profil par propriétaire ou admin" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER'));

CREATE POLICY "Lecture transactions utilisateur" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'FINANCE'));

CREATE POLICY "Lecture messages chat" ON public.chat_messages
    FOR SELECT USING (auth.uid() = client_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT'));

CREATE POLICY "Lecture journal audit par Direction" ON public.audit_logs
    FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('OWNER', 'SUPER_ADMIN'));
