-- Activation automatique des nouveaux comptes clients (plus de validation admin).
-- À exécuter une fois dans Supabase > SQL Editor. Les comptes déjà en attente
-- (PENDING_APPROVAL) ne sont pas modifiés.

ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'ACTIVE';

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (
        public.get_my_role() IN ('OWNER', 'OWNER_A_PLUS', 'OWNER_B_PLUS', 'SUPER_ADMIN', 'ADMIN')
        OR (
            auth.uid() = id
            AND role = 'TRADER'
            AND status IN ('ACTIVE', 'PENDING_APPROVAL')
            AND kyc_status IN ('PENDING', 'NOT_SUBMITTED')
            AND balance = 0
        )
    );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_country TEXT;
  v_phone TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_country := COALESCE(NEW.raw_user_meta_data->>'country', 'France');
  v_phone := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '');

  INSERT INTO public.profiles (
    id,
    email,
    name,
    country,
    phone,
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
    v_phone,
    'TRADER',
    'ACTIVE',
    'PENDING',
    0.00,
    'Desk de Conformité & Risque'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = CASE WHEN profiles.name = '' OR profiles.name IS NULL THEN EXCLUDED.name ELSE profiles.name END,
    country = CASE WHEN profiles.country IS NULL THEN EXCLUDED.country ELSE profiles.country END,
    phone = CASE WHEN profiles.phone = '' OR profiles.phone IS NULL THEN EXCLUDED.phone ELSE profiles.phone END;

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
