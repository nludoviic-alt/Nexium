// Supabase Edge Function: manage-account
//
// Suppression, archivage et restauration d'un compte par l'administration.
// Remplace la RPC SQL delete_user_by_admin et la suppression directe de
// public.profiles depuis le navigateur, qui :
//   - autorisaient le rôle ADMIN (exclu de la policy profiles_delete) et ne
//     vérifiaient pas le rôle de la cible ;
//   - retombaient silencieusement sur une suppression du seul profil, laissant
//     le compte auth.users orphelin et affichant « supprimé » même en cas de
//     refus de la base.
//
// Règles (tout est vérifié ici, côté serveur, avec la clé service_role) :
//   - appelant authentifié et au statut ACTIVE ;
//   - jamais le Super Owner, jamais soi-même ;
//   - client (TRADER) : suppression, archivage et restauration réservés au
//     Super Owner ;
//   - staff : suppression selon la hiérarchie de la policy profiles_delete
//     (Super Owner > Owner A+/B+ > Owner/Super Admin) ; archivage et
//     restauration réservés au Super Owner ;
//   - journal d'audit écrit par le serveur.
//
// Actions :
//   delete  : auth.admin.deleteUser (identifiants, sessions, refresh tokens) ;
//             public.profiles suit par ON DELETE CASCADE.
//   archive : connexion bloquée (ban auth) + profiles.status = 'ARCHIVED' ;
//             toutes les données (transactions, historique) sont conservées.
//   restore : levée du blocage + profiles.status = 'ACTIVE'.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OWNER_ROLES = ["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS"];
const A_PLUS_B_PLUS = ["OWNER_A_PLUS", "OWNER_B_PLUS"];
const ARCHIVE_BAN_DURATION = "876000h"; // ~100 ans

type Action = "delete" | "archive" | "restore";

interface Profile {
  id: string;
  role: string;
  status: string | null;
  is_primary_owner: boolean | null;
  email: string | null;
  name: string | null;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function isAllowed(caller: Profile, action: Action, targetRole: string): boolean {
  if (caller.is_primary_owner) return true;
  // Clients : tout est réservé au Super Owner. Archivage/restauration aussi.
  if (targetRole === "TRADER" || action !== "delete") return false;
  // Staff : même hiérarchie que la policy SQL profiles_delete.
  if (A_PLUS_B_PLUS.includes(caller.role)) return !A_PLUS_B_PLUS.includes(targetRole);
  if (caller.role === "OWNER" || caller.role === "SUPER_ADMIN") return !OWNER_ROLES.includes(targetRole);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Méthode non autorisée" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ success: false, error: "Configuration serveur incomplète" }, 503);
  }

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return jsonResponse({ success: false, error: "Authentification administrateur manquante" }, 401);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Appelant
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return jsonResponse({ success: false, error: "Session administrateur invalide ou expirée" }, 401);
  }

  const { data: caller } = await supabaseAdmin
    .from("profiles")
    .select("id, role, status, is_primary_owner, email, name")
    .eq("id", userData.user.id)
    .maybeSingle<Profile>();

  if (!caller || caller.status !== "ACTIVE") {
    return jsonResponse({ success: false, error: "Droits administrateur insuffisants" }, 403);
  }

  let body: { action?: unknown; userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Corps de requête JSON invalide" }, 400);
  }

  const action = body.action as Action;
  if (!["delete", "archive", "restore"].includes(action)) {
    return jsonResponse({ success: false, error: "Action inconnue" }, 400);
  }
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!UUID_REGEX.test(userId)) {
    return jsonResponse({ success: false, error: "Identifiant utilisateur invalide" }, 400);
  }
  if (userId === caller.id) {
    return jsonResponse({ success: false, error: "Action impossible sur votre propre compte" }, 403);
  }

  // 2. Cible : profil (peut manquer pour un compte orphelin) + compte auth
  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("id, role, status, is_primary_owner, email, name")
    .eq("id", userId)
    .maybeSingle<Profile>();

  const { data: authTarget } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (!target && !authTarget?.user) {
    return jsonResponse({ success: false, error: "Compte introuvable" }, 404);
  }
  if (!target && action !== "delete") {
    return jsonResponse({ success: false, error: "Profil introuvable" }, 404);
  }

  if (target?.is_primary_owner) {
    return jsonResponse({ success: false, error: "Le compte Super Owner est protégé" }, 403);
  }

  const targetRole = target?.role || "TRADER";
  if (!isAllowed(caller, action, targetRole)) {
    return jsonResponse(
      {
        success: false,
        error:
          targetRole === "TRADER"
            ? "Seul le Super Owner peut supprimer, archiver ou restaurer un client"
            : "Votre rôle ne permet pas cette action sur ce compte",
      },
      403,
    );
  }

  const targetEmail = target?.email || authTarget?.user?.email || null;

  // 3. Exécution
  if (action === "delete") {
    if (authTarget?.user) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        console.error("Erreur auth.admin.deleteUser:", error);
        return jsonResponse({ success: false, error: error.message || "Échec de la suppression" }, 500);
      }
    }
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
    if (profileError) {
      console.error("Erreur suppression profil:", profileError);
      return jsonResponse({ success: false, error: "Compte supprimé mais profil non nettoyé" }, 500);
    }
  } else {
    const archiving = action === "archive";
    if (authTarget?.user) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: archiving ? ARCHIVE_BAN_DURATION : "none",
      });
      if (error) {
        console.error("Erreur blocage/déblocage auth:", error);
        return jsonResponse({ success: false, error: error.message || "Échec de l'opération" }, 500);
      }
    }
    const { error: statusError } = await supabaseAdmin
      .from("profiles")
      .update({ status: archiving ? "ARCHIVED" : "ACTIVE" })
      .eq("id", userId);
    if (statusError) {
      console.error("Erreur mise à jour statut:", statusError);
      return jsonResponse({ success: false, error: "Échec de la mise à jour du statut" }, 500);
    }
  }

  // 4. Journal d'audit (côté serveur, non falsifiable par le navigateur)
  const isClient = targetRole === "TRADER";
  const auditAction = {
    delete: isClient ? "CLIENT_DELETED" : "STAFF_DELETED",
    archive: isClient ? "CLIENT_ARCHIVED" : "STAFF_ARCHIVED",
    restore: isClient ? "CLIENT_RESTORED" : "STAFF_RESTORED",
  }[action];
  const auditMessage = {
    delete: `Compte ${targetRole} supprimé définitivement (auth.users + profiles).`,
    archive: `Compte ${targetRole} archivé : connexion bloquée, données conservées.`,
    restore: `Compte ${targetRole} restauré : connexion réactivée.`,
  }[action];

  const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
    admin_id: caller.id,
    admin_name: caller.name || caller.email || caller.id,
    action: auditAction,
    target_user_id: userId,
    target_user_email: targetEmail,
    details: { message: auditMessage, name: target?.name ?? null, role: targetRole, caller_role: caller.role },
  });
  if (auditError) {
    console.error("Erreur écriture audit_logs:", auditError);
  }

  return jsonResponse({ success: true, action, user_id: userId });
});
