-- ==========================================================================
-- Migration : Ajout de la colonne crypto_wallets dans public.profiles
-- Date      : 2026-10-20
-- Objectif  : Stockage et synchronisation des coordonnées crypto (BTC, ETH, USDT)
--             entre le Desk (admin) et le Dashboard client.
-- ==========================================================================

BEGIN;

-- 1. Ajout de la colonne crypto_wallets (JSONB)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS crypto_wallets JSONB
DEFAULT '{}'::jsonb;

-- 2. Garantir la valeur par défaut de updated_at
ALTER TABLE public.profiles
ALTER COLUMN updated_at SET DEFAULT NOW();

-- 3. Index GIN pour les recherches et requêtes JSONB
CREATE INDEX IF NOT EXISTS idx_profiles_crypto_wallets
ON public.profiles
USING GIN (crypto_wallets jsonb_path_ops);

-- 4. Activation RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS conformes à NEXIUM.md §7.C & §8
-- Lecture : l'utilisateur lui-même ou le staff autorisé du Desk
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id
    OR public.get_my_role() IN (
        'OWNER',
        'OWNER_A_PLUS',
        'OWNER_B_PLUS',
        'SUPER_ADMIN',
        'ADMIN',
        'CONSEILLER',
        'FINANCE',
        'SUPPORT'
    )
);

-- Écriture : l'utilisateur sur son profil ou le staff autorisé du Desk
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    auth.uid() = id
    OR public.get_my_role() IN (
        'OWNER',
        'OWNER_A_PLUS',
        'OWNER_B_PLUS',
        'SUPER_ADMIN',
        'ADMIN',
        'CONSEILLER',
        'FINANCE',
        'SUPPORT'
    )
)
WITH CHECK (
    auth.uid() = id
    OR public.get_my_role() IN (
        'OWNER',
        'OWNER_A_PLUS',
        'OWNER_B_PLUS',
        'SUPER_ADMIN',
        'ADMIN',
        'CONSEILLER',
        'FINANCE',
        'SUPPORT'
    )
);

COMMIT;
