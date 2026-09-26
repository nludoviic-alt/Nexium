-- ==============================================================================
-- Migration : Suppression définitive des comptes utilisateurs par l'administration
-- ==============================================================================
-- Cette fonction PostgreSQL s'exécute avec les privilèges SECURITY DEFINER.
-- Elle permet aux administrateurs (et Owners) de supprimer un compte client
-- à la fois de la table public.profiles ET de auth.users (identifiants, sessions, mot de passe).
--
-- Exécutez ce script dans Supabase > SQL Editor.

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_role TEXT;
  v_target_is_owner BOOLEAN;
BEGIN
  -- 1. Vérifier l'identité et le rôle de l'appelant
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('OWNER', 'OWNER_A_PLUS', 'OWNER_B_PLUS', 'SUPER_ADMIN', 'ADMIN') THEN
    RAISE EXCEPTION 'Action non autorisée : privilèges administrateur requis';
  END IF;

  -- 2. Protection absolue du Super Owner et des Owners
  SELECT COALESCE(is_primary_owner, FALSE) OR role LIKE 'OWNER%' INTO v_target_is_owner
  FROM public.profiles WHERE id = target_user_id;

  IF v_target_is_owner THEN
    RAISE EXCEPTION 'Action interdite : impossible de supprimer un compte Propriétaire / Owner';
  END IF;

  -- 3. Suppression dans public.profiles (au cas où les clés étrangères ne cascadent pas)
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 4. Suppression définitive dans auth.users (invalide sessions, tokens et mot de passe)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'deleted_user_id', target_user_id);
END;
$$;

-- Accorder le droit d'exécution aux utilisateurs authentifiés (la fonction vérifie le rôle en interne)
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;
