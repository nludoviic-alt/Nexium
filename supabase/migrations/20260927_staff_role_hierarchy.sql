-- ==============================================================================
-- Migration : hiérarchie d'attribution des rôles + protection du Super Owner
-- ==============================================================================
-- À exécuter une fois dans Supabase > SQL Editor.
--
-- PROBLÈME : la policy profiles_update autorise tout le staff (ADMIN,
-- CONSEILLER, FINANCE, SUPPORT…) à modifier n'importe quelle fiche, et le
-- trigger protect_privileged_profile_fields ne contrôlait que l'attribution des
-- rôles Owner. Un SUPPORT pouvait donc se nommer lui-même SUPER_ADMIN par un
-- simple appel API, et un ADMIN pouvait rétrograder un Owner.
--
-- RÈGLES (identiques à l'Edge Function create-account) :
--   - personne ne change son propre rôle ;
--   - Super Owner          : attribue / retire tous les rôles ;
--   - Owner A+ / B+        : SUPER_ADMIN, ADMIN, CONSEILLER, SUPPORT, FINANCE, QUANT ;
--   - Owner / Super Admin  : ADMIN, CONSEILLER, SUPPORT, FINANCE, QUANT ;
--   - autres rôles         : aucun changement de rôle.
--   Pour changer un rôle, l'appelant doit avoir autorité à la fois sur l'ancien
--   et sur le nouveau rôle (TRADER compris dans le périmètre de chacun).
--   - La fiche du Super Owner ne peut être modifiée que par lui-même.
--
-- Trigger séparé : le trigger verrouillé protect_privileged_profile_fields
-- (NEXIUM.md §7.C) n'est pas modifié. Les appels serveur (service_role,
-- auth.uid() NULL) ne sont pas concernés.

-- @nexium-lock-start staff-role-hierarchy — voir NEXIUM.md §8
CREATE OR REPLACE FUNCTION public.can_manage_role(target_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  IF public.am_i_primary_owner() THEN
    RETURN TRUE;
  END IF;

  caller_role := public.get_my_role();

  IF caller_role IN ('OWNER_A_PLUS', 'OWNER_B_PLUS') THEN
    RETURN target_role IN ('SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT', 'FINANCE', 'QUANT', 'TRADER');
  END IF;

  IF caller_role IN ('OWNER', 'SUPER_ADMIN') THEN
    RETURN target_role IN ('ADMIN', 'CONSEILLER', 'SUPPORT', 'FINANCE', 'QUANT', 'TRADER');
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'TRADER' AND NOT public.can_manage_role(NEW.role) THEN
      RAISE EXCEPTION 'Votre rôle ne permet pas d''attribuer ce rôle.';
    END IF;
    RETURN NEW;
  END IF;

  -- Fiche du Super Owner : modifiable uniquement par lui-même.
  IF OLD.is_primary_owner AND OLD.id <> auth.uid() THEN
    RAISE EXCEPTION 'Modification non autorisée.';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF OLD.id = auth.uid() THEN
      RAISE EXCEPTION 'Vous ne pouvez pas modifier votre propre rôle.';
    END IF;
    IF NOT public.can_manage_role(OLD.role) OR NOT public.can_manage_role(NEW.role) THEN
      RAISE EXCEPTION 'Votre rôle ne permet pas ce changement de rôle.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_role_changes ON public.profiles;
CREATE TRIGGER trg_protect_role_changes
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_role_changes();
-- @nexium-lock-end staff-role-hierarchy
