-- Nouvelle demande d'activation après expiration d'un preset.
-- Un client pouvait seulement passer de NOT_REQUESTED à PENDING_PRESET_APPROVAL :
-- une fois un preset validé (license_status = ACTIVE) ou expiré, sa nouvelle
-- demande était silencieusement annulée par ce trigger. Il peut désormais
-- redemander l'activation depuis ACTIVE ou EXPIRED ; tout autre changement de
-- license_status reste réservé au staff.
-- À exécuter une fois dans Supabase > SQL Editor.

CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_primary_owner BOOLEAN;
  engines_active_only BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_primary_owner INTO caller_is_primary_owner FROM public.profiles WHERE id = auth.uid();
  caller_is_primary_owner := COALESCE(caller_is_primary_owner, FALSE);

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IN ('OWNER', 'OWNER_A_PLUS', 'OWNER_B_PLUS') AND NOT caller_is_primary_owner THEN
      RAISE EXCEPTION 'Seul le Super Owner peut attribuer ce rôle.';
    END IF;
    IF NEW.is_primary_owner AND NOT caller_is_primary_owner THEN
      RAISE EXCEPTION 'Le statut de Super Owner ne peut être attribué que manuellement en base.';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.role IN ('OWNER', 'OWNER_A_PLUS', 'OWNER_B_PLUS') AND NEW.role IS DISTINCT FROM OLD.role AND NOT caller_is_primary_owner THEN
    RAISE EXCEPTION 'Seul le Super Owner peut attribuer ce rôle.';
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
    NEW.bonus_credit := OLD.bonus_credit;
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

  IF public.get_my_role() NOT IN ('OWNER', 'OWNER_A_PLUS', 'OWNER_B_PLUS', 'SUPER_ADMIN', 'ADMIN', 'CONSEILLER') THEN
    NEW.role := OLD.role;
    NEW.status := OLD.status;
    NEW.kyc_status := OLD.kyc_status;
    NEW.balance := OLD.balance;
    NEW.bonus_credit := OLD.bonus_credit;
    NEW.gross_profit_total := OLD.gross_profit_total;
    NEW.gross_loss_total := OLD.gross_loss_total;
    NEW.mt5_login := OLD.mt5_login;
    NEW.mt5_broker := OLD.mt5_broker;
    NEW.mt5_server := OLD.mt5_server;
    NEW.mt5_investor_pass := OLD.mt5_investor_pass;
    NEW.assigned_advisor := OLD.assigned_advisor;
    -- Exception : un client (TRADER) peut lui-même déclencher une demande
    -- d'activation de Preset (-> PENDING_PRESET_APPROVAL), y compris une
    -- nouvelle demande après l'expiration d'un preset (ACTIVE / EXPIRED).
    -- Toute autre valeur (ex: passage direct à ACTIVE) reste réservée au staff.
    IF NOT (
      NEW.license_status = 'PENDING_PRESET_APPROVAL'
      AND COALESCE(OLD.license_status, 'NOT_REQUESTED') IN ('NOT_REQUESTED', 'PENDING_PRESET_APPROVAL', 'ACTIVE', 'EXPIRED')
    ) THEN
      NEW.license_status := OLD.license_status;
    END IF;
    NEW.active_preset := OLD.active_preset;
    NEW.max_daily_loss_percent := OLD.max_daily_loss_percent;
    NEW.max_simultaneous_trades := OLD.max_simultaneous_trades;
    NEW.risk_guard_auto_stop := OLD.risk_guard_auto_stop;

    -- Exception : un client (TRADER) peut librement mettre en pause / reprendre
    -- SES PROPRES moteurs (le champ "active" de chaque moteur dans
    -- engines_config) — c'est un contrôle de sécurité personnel légitime.
    -- Il ne peut en revanche pas modifier le preset, la taille de lot, le
    -- score minimal ou le plafond de risque de ces moteurs : ça reste une
    -- décision du Desk (validation initiale du Preset, réglages de risque).
    IF OLD.engines_config IS NOT NULL AND NEW.engines_config IS NOT NULL THEN
      engines_active_only := (
        jsonb_set(
          jsonb_set(
            jsonb_set(
              OLD.engines_config,
              '{aiGold,active}',
              COALESCE(NEW.engines_config #> '{aiGold,active}', OLD.engines_config #> '{aiGold,active}', 'null'::jsonb)
            ),
            '{fxTrend,active}',
            COALESCE(NEW.engines_config #> '{fxTrend,active}', OLD.engines_config #> '{fxTrend,active}', 'null'::jsonb)
          ),
          '{indexReversion,active}',
          COALESCE(NEW.engines_config #> '{indexReversion,active}', OLD.engines_config #> '{indexReversion,active}', 'null'::jsonb)
        ) = NEW.engines_config
      );
    ELSE
      engines_active_only := (NEW.engines_config IS NOT DISTINCT FROM OLD.engines_config);
    END IF;

    IF NOT engines_active_only THEN
      NEW.engines_config := OLD.engines_config;
    END IF;

    NEW.license_key := OLD.license_key;
    NEW.license_expires := OLD.license_expires;
  END IF;

  RETURN NEW;
END;
$$;
