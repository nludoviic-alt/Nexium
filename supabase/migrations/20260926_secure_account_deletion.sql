-- ==============================================================================
-- Migration : sécurisation de la suppression / archivage de compte
-- ==============================================================================
-- À exécuter une fois dans Supabase > SQL Editor, APRÈS le déploiement de
-- l'Edge Function `manage-account` (supabase/functions/manage-account).
--
-- 1. Suppression de la RPC delete_user_by_admin : elle autorisait le rôle ADMIN
--    (exclu de la policy profiles_delete) et ne vérifiait pas le rôle de la
--    cible. Suppression, archivage et restauration passent désormais
--    uniquement par l'Edge Function manage-account.
--
-- 2. Fermeture de l'auto-insertion de profil par un utilisateur : le profil est
--    créé par le trigger handle_new_user (SECURITY DEFINER, non soumis à RLS).
--    L'ancienne branche « auth.uid() = id » permettait à un compte dont le
--    profil avait été supprimé de le recréer via l'API avec bonus_credit,
--    license_status, engines_config ou gross_profit_total arbitraires.
--
-- 3. Nouveau statut ARCHIVED (compte bloqué, données conservées).
--
-- 4. Suppression d'un client (TRADER) réservée au Super Owner, y compris par
--    un DELETE direct via l'API.
--
-- 5. Seul le Super Owner peut faire entrer ou sortir un compte du statut
--    ARCHIVED (les appels serveur avec la clé service_role, auth.uid() NULL,
--    ne sont pas concernés). Trigger séparé : le trigger verrouillé
--    protect_privileged_profile_fields (NEXIUM.md §7.C) n'est pas modifié.

-- 1.
DROP FUNCTION IF EXISTS public.delete_user_by_admin(UUID);

-- 2.
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (
        public.get_my_role() IN ('OWNER', 'OWNER_A_PLUS', 'OWNER_B_PLUS', 'SUPER_ADMIN', 'ADMIN')
    );

-- 3.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'BANNED', 'REVOKED', 'ARCHIVED'));

-- 4.
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles
    FOR DELETE USING (
        NOT is_primary_owner
        AND (
            public.am_i_primary_owner()
            OR (
                role <> 'TRADER'
                AND (
                    (public.get_my_role() IN ('OWNER_A_PLUS', 'OWNER_B_PLUS') AND role NOT IN ('OWNER_A_PLUS', 'OWNER_B_PLUS'))
                    OR (public.get_my_role() IN ('OWNER', 'SUPER_ADMIN') AND role NOT IN ('OWNER', 'OWNER_A_PLUS', 'OWNER_B_PLUS'))
                )
            )
        )
    );

-- 5.
CREATE OR REPLACE FUNCTION public.protect_archived_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF (COALESCE(OLD.status, '') = 'ARCHIVED') IS DISTINCT FROM (COALESCE(NEW.status, '') = 'ARCHIVED')
     AND NOT public.am_i_primary_owner() THEN
    RAISE EXCEPTION 'Seul le Super Owner peut archiver ou restaurer un compte.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_archived_status ON public.profiles;
CREATE TRIGGER trg_protect_archived_status
    BEFORE UPDATE OF status ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_archived_status();
