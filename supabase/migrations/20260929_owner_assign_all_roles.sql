-- Les Owners (rôle OWNER) peuvent attribuer tous les rôles, Owner compris.
-- Le Super Owner reste protégé : sa fiche n'est modifiable que par lui-même
-- (trigger protect_role_changes, inchangé), et personne ne change son propre rôle.

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

  IF caller_role = 'OWNER' THEN
    RETURN target_role IN ('OWNER', 'OWNER_A_PLUS', 'OWNER_B_PLUS', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT', 'FINANCE', 'QUANT', 'TRADER');
  END IF;

  IF caller_role IN ('OWNER_A_PLUS', 'OWNER_B_PLUS') THEN
    RETURN target_role IN ('SUPER_ADMIN', 'ADMIN', 'CONSEILLER', 'SUPPORT', 'FINANCE', 'QUANT', 'TRADER');
  END IF;

  IF caller_role = 'SUPER_ADMIN' THEN
    RETURN target_role IN ('ADMIN', 'CONSEILLER', 'SUPPORT', 'FINANCE', 'QUANT', 'TRADER');
  END IF;

  RETURN FALSE;
END;
$$;
-- @nexium-lock-end staff-role-hierarchy
