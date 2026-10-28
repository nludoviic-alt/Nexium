// Supabase Edge Function: admin-actions
// Actions administratives sur un compte CLIENT, nécessitant la clé service_role :
// - update-user-email : mettre à jour l'e-mail officiel d'un client
// - set-user-password : définir un nouveau mot de passe pour un client
// - kill-sessions     : révoquer les sessions actives d'un client
//
// Règles :
// - Appelant : staff ACTIF de rôle OWNER, OWNER_A_PLUS, OWNER_B_PLUS, SUPER_ADMIN ou ADMIN.
// - Cible : uniquement un compte client (TRADER). Jamais un membre du staff,
//   jamais le Super Owner, jamais son propre compte.
// - Chaque action est inscrite dans audit_logs côté serveur.
// - Les invitations passent exclusivement par create-account (NEXIUM.md §8 F) :
//   l'ancienne action invite-user est refusée ici.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CLIENT_MANAGER_ROLES = ["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS", "SUPER_ADMIN", "ADMIN"];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
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
    return jsonResponse(
      { success: false, error: "Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY manquant)" },
      503
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return jsonResponse({ success: false, error: "Authentification administrateur manquante" }, 401);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Authentification de l'administrateur appelant
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return jsonResponse({ success: false, error: "Session administrateur invalide ou expirée" }, 401);
  }

  const { data: caller, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, role, status, email")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !caller || !CLIENT_MANAGER_ROLES.includes(caller.role) || caller.status !== "ACTIVE") {
    return jsonResponse({ success: false, error: "Droits administrateur insuffisants" }, 403);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Corps de requête JSON invalide" }, 400);
  }

  const action = body?.action;

  if (action === "invite-user") {
    return jsonResponse(
      { success: false, error: "Les invitations passent uniquement par le service create-account." },
      410
    );
  }

  if (!["update-user-email", "set-user-password", "kill-sessions"].includes(action)) {
    return jsonResponse({ success: false, error: `Action inconnue : ${action}` }, 400);
  }

  // 2. Contrôle de la cible : un client existant, jamais le staff ni soi-même
  const userId = String(body?.userId || "");
  if (!userId) {
    return jsonResponse({ success: false, error: "userId requis" }, 400);
  }
  if (userId === caller.id) {
    return jsonResponse({ success: false, error: "Action impossible sur votre propre compte" }, 403);
  }

  const { data: target, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, role, is_primary_owner")
    .eq("id", userId)
    .single();

  if (targetError || !target) {
    return jsonResponse({ success: false, error: "Compte client introuvable" }, 404);
  }
  if (target.role !== "TRADER" || target.is_primary_owner) {
    return jsonResponse({ success: false, error: "Action réservée aux comptes clients" }, 403);
  }

  const writeAudit = async (auditAction: string, message: string, extra: Record<string, unknown> = {}) => {
    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      admin_id: caller.id,
      admin_name: caller.name || caller.email || caller.id,
      action: auditAction,
      target_user_id: target.id,
      target_user_email: target.email,
      details: { message, name: target.name ?? null, caller_role: caller.role, ...extra },
    });
    if (auditError) console.error("Erreur écriture audit_logs:", auditError);
  };

  try {
    // ── ACTION : MISE À JOUR EMAIL ──
    if (action === "update-user-email") {
      const newEmail = String(body?.newEmail || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return jsonResponse({ success: false, error: "Adresse e-mail invalide" }, 400);
      }

      const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail,
        email_confirm: true,
      });
      if (updateAuthErr) {
        return jsonResponse({ success: false, error: updateAuthErr.message }, 400);
      }

      await supabaseAdmin.from("profiles").update({ email: newEmail }).eq("id", userId);
      await writeAudit("CLIENT_EMAIL_CHANGED", "E-mail de connexion du client modifié.", {
        old_email: target.email,
        new_email: newEmail,
      });
      return jsonResponse({ success: true, ok: true });
    }

    // ── ACTION : NOUVEAU MOT DE PASSE ──
    if (action === "set-user-password") {
      const newPassword = String(body?.newPassword || "");
      if (newPassword.length < 8) {
        return jsonResponse({ success: false, error: "Le mot de passe doit contenir au moins 8 caractères" }, 400);
      }

      const { error: setPassErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });
      if (setPassErr) {
        return jsonResponse({ success: false, error: setPassErr.message }, 400);
      }

      // Le mot de passe lui-même n'est jamais écrit dans le journal.
      await writeAudit("CLIENT_PASSWORD_CHANGED", "Nouveau mot de passe défini par l'administration.");
      return jsonResponse({ success: true, ok: true });
    }

    // ── ACTION : RÉVOCATION DES SESSIONS ──
    if (action === "kill-sessions") {
      // Remplacer le mot de passe par un secret aléatoire invalide les jetons du client.
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const randomPassword = btoa(String.fromCharCode(...bytes));
      const { error: killErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: randomPassword,
      });
      if (killErr) {
        return jsonResponse({ success: false, error: killErr.message }, 400);
      }

      await writeAudit("CLIENT_SESSIONS_REVOKED", "Sessions actives du client révoquées.");
      return jsonResponse({ success: true, ok: true });
    }

    return jsonResponse({ success: false, error: `Action inconnue : ${action}` }, 400);
  } catch (err: any) {
    console.error("Erreur admin-actions Edge Function:", err);
    return jsonResponse({ success: false, error: err.message || "Erreur interne du serveur" }, 500);
  }
});
