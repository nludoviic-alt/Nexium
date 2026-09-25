// Supabase Edge Function: admin-actions
// Actions administratives privilégiées nécessitant la clé service_role côté serveur :
// - invite-user : Inviter un client ou collaborateur (auth.users + profiles)
// - update-user-email : Mettre à jour l'e-mail officiel d'un utilisateur
// - set-user-password : Réinitialiser le mot de passe d'un utilisateur
// - kill-sessions : Révoquer les sessions actives d'un utilisateur

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_ROLES = [
  "OWNER",
  "OWNER_A_PLUS",
  "OWNER_B_PLUS",
  "SUPER_ADMIN",
  "ADMIN",
  "CONSEILLER",
  "SUPPORT",
  "FINANCE",
  "QUANT",
];

const ALL_ROLES = [...ADMIN_ROLES, "TRADER"];

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

  const { data: callerProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, status, is_primary_owner, email")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !callerProfile || !ADMIN_ROLES.includes(callerProfile.role) || callerProfile.status !== "ACTIVE") {
    return jsonResponse({ success: false, error: "Droits administrateur insuffisants" }, 403);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Corps de requête JSON invalide" }, 400);
  }

  const action = body?.action;
  const redirectUrl =
    Deno.env.get("INVITE_REDIRECT_URL") || "https://nexiummarkets.com/reset-password";

  try {
    // ── ACTION : INVITATION UTILISATEUR ──
    if (action === "invite-user") {
      const { name, email, phone, role } = body;
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanName = String(name || "").trim();

      if (!cleanName || !cleanEmail || !role) {
        return jsonResponse({ success: false, error: "Nom, e-mail et rôle sont obligatoires" }, 400);
      }

      if (!ALL_ROLES.includes(role)) {
        return jsonResponse({ success: false, error: "Rôle sélectionné invalide" }, 400);
      }

      if (["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS"].includes(role) && !callerProfile.is_primary_owner) {
        return jsonResponse({ success: false, error: "Seul le Super Owner peut désigner un rôle Direction" }, 403);
      }

      // Inviter l'utilisateur via Supabase Auth Admin
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
        data: { name: cleanName },
        redirectTo: redirectUrl,
      });

      if (inviteError) {
        // Si l'utilisateur est déjà inscrit, mettre à jour son profil directement
        if (inviteError.message?.toLowerCase().includes("already") || inviteError.message?.toLowerCase().includes("existe")) {
          const { data: existingProfiles } = await supabaseAdmin
            .from("profiles")
            .select("id, role")
            .eq("email", cleanEmail);

          const existing = existingProfiles?.[0];
          if (existing) {
            await supabaseAdmin.from("profiles").update({
              role,
              name: cleanName,
              phone: phone || null,
              status: "ACTIVE",
            }).eq("id", existing.id);
            return jsonResponse({ success: true, ok: true, id: existing.id, promoted: true });
          }
        }
        return jsonResponse({ success: false, error: inviteError.message || "Échec de l'invitation" }, 400);
      }

      const invitedUser = inviteData.user;
      if (!invitedUser) {
        return jsonResponse({ success: false, error: "Erreur lors de la création du compte invité" }, 500);
      }

      // Synchroniser le profil dans public.profiles
      const { error: insertProfileErr } = await supabaseAdmin.from("profiles").upsert(
        {
          id: invitedUser.id,
          email: cleanEmail,
          name: cleanName,
          phone: phone || null,
          role,
          status: "ACTIVE",
          kyc_status: "NOT_SUBMITTED",
        },
        { onConflict: "id" }
      );

      if (insertProfileErr) {
        console.error("Erreur upsert profil invité:", insertProfileErr);
      }

      return jsonResponse({ success: true, ok: true, id: invitedUser.id });
    }

    // ── ACTION : MISE À JOUR EMAIL ──
    if (action === "update-user-email") {
      const { userId, newEmail } = body;
      if (!userId || !newEmail) {
        return jsonResponse({ success: false, error: "userId et newEmail sont requis" }, 400);
      }

      const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail,
        email_confirm: true,
      });

      if (updateAuthErr) {
        return jsonResponse({ success: false, error: updateAuthErr.message }, 400);
      }

      await supabaseAdmin.from("profiles").update({ email: newEmail }).eq("id", userId);
      return jsonResponse({ success: true, ok: true });
    }

    // ── ACTION : RÉINITIALISATION MOT DE PASSE ──
    if (action === "set-user-password") {
      const { userId, newPassword } = body;
      if (!userId || !newPassword || newPassword.length < 8) {
        return jsonResponse({ success: false, error: "userId et mot de passe (min. 8 car.) requis" }, 400);
      }

      const { error: setPassErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (setPassErr) {
        return jsonResponse({ success: false, error: setPassErr.message }, 400);
      }

      return jsonResponse({ success: true, ok: true });
    }

    // ── ACTION : RÉVOCATION DES SESSIONS ──
    if (action === "kill-sessions") {
      const { userId } = body;
      if (!userId) {
        return jsonResponse({ success: false, error: "userId requis" }, 400);
      }

      const randomPassword = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || "x").join("");
      const { error: killErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: randomPassword,
      });

      if (killErr) {
        return jsonResponse({ success: false, error: killErr.message }, 400);
      }

      return jsonResponse({ success: true, ok: true });
    }

    return jsonResponse({ success: false, error: `Action inconnue : ${action}` }, 400);
  } catch (err: any) {
    console.error("Erreur admin-actions Edge Function:", err);
    return jsonResponse({ success: false, error: err.message || "Erreur interne du serveur" }, 500);
  }
});
