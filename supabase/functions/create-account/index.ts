// Supabase Edge Function: create-account
//
// Création d'un compte par l'administration : invitation d'un client ou d'un
// membre du staff, ou attribution d'un rôle staff à un compte existant.
// Remplace le chemin précédent qui :
//   - promouvait silencieusement un compte existant (y compris un client, ou un
//     compte banni remis en ACTIVE) directement depuis le navigateur ;
//   - ne contrôlait l'attribution des rôles que dans l'interface ;
//   - affichait « Invitation envoyée » même quand rien n'était créé.
//
// Rôles attribuables (identique au trigger SQL protect_role_changes) :
//   Super Owner          : tous les rôles.
//   Owner A+ / B+        : SUPER_ADMIN, ADMIN, CONSEILLER, SUPPORT, FINANCE, QUANT.
//   Owner / Super Admin  : ADMIN, CONSEILLER, SUPPORT, FINANCE, QUANT.
//   Invitation d'un client (TRADER) : Super Owner, Owner*, Super Admin, Admin.
//
// Compte existant : jamais de promotion silencieuse. Sans `confirmPromote`, la
// fonction renvoie 409 avec le rôle actuel pour que le Desk demande
// confirmation. Le statut du compte n'est pas modifié (un compte banni le
// reste) et la personne est prévenue par e-mail. Le Super Owner n'est jamais
// modifiable ni révélé.

// @nexium-lock-start create-account — voir NEXIUM.md §8
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALL_ROLES = [
  "OWNER",
  "OWNER_A_PLUS",
  "OWNER_B_PLUS",
  "SUPER_ADMIN",
  "ADMIN",
  "CONSEILLER",
  "SUPPORT",
  "FINANCE",
  "QUANT",
  "TRADER",
];
const BASE_STAFF_ROLES = ["ADMIN", "CONSEILLER", "SUPPORT", "FINANCE", "QUANT"];
const CLIENT_INVITER_ROLES = ["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS", "SUPER_ADMIN", "ADMIN"];

interface Profile {
  id: string;
  role: string;
  status: string | null;
  is_primary_owner: boolean | null;
  email: string | null;
  name: string | null;
  phone?: string | null;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** Rôles staff (hors TRADER) que l'appelant peut attribuer ou retirer. */
function assignableStaffRoles(caller: Profile): string[] {
  if (caller.is_primary_owner) return ALL_ROLES.filter((r) => r !== "TRADER");
  if (caller.role === "OWNER_A_PLUS" || caller.role === "OWNER_B_PLUS") return ["SUPER_ADMIN", ...BASE_STAFF_ROLES];
  if (caller.role === "OWNER" || caller.role === "SUPER_ADMIN") return [...BASE_STAFF_ROLES];
  return [];
}

function roleLabel(role: string): string {
  return (
    {
      OWNER: "Owner",
      OWNER_A_PLUS: "Owner A+",
      OWNER_B_PLUS: "Owner B+",
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
      CONSEILLER: "Conseiller",
      SUPPORT: "Support",
      FINANCE: "Finance",
      QUANT: "Quant",
      TRADER: "Client",
    }[role] || role
  );
}

async function notifyRoleChange(to: string, name: string, role: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) return;
  const from = Deno.env.get("RESEND_FROM_EMAIL") || "Nexium Markets <support@nexiummarkets.com>";
  const safeName = name.replace(/[<>&"]/g, "");
  const html =
    `<p>Bonjour ${safeName},</p>` +
    `<p>Votre compte Nexium Markets dispose désormais du rôle <strong>${roleLabel(role)}</strong>. ` +
    `Connectez-vous avec vos identifiants habituels sur <a href="https://nexiummarkets.com/login">nexiummarkets.com</a> pour accéder au Desk.</p>` +
    `<p>Si vous n'attendiez pas ce changement, contactez immédiatement support@nexiummarkets.com.</p>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: "Nexium Markets — Nouveau rôle sur votre compte", html }),
    });
  } catch (err) {
    console.error("Erreur notification changement de rôle:", err);
  }
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

  // 2. Paramètres
  let body: { name?: unknown; email?: unknown; phone?: unknown; role?: unknown; confirmPromote?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Corps de requête JSON invalide" }, 400);
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
  const role = typeof body.role === "string" ? body.role : "";
  const confirmPromote = body.confirmPromote === true;

  if (!name || !EMAIL_REGEX.test(email) || !ALL_ROLES.includes(role)) {
    return jsonResponse({ success: false, error: "Nom, e-mail valide et rôle sont obligatoires" }, 400);
  }

  // 3. Droit d'attribuer ce rôle
  const staffRoles = assignableStaffRoles(caller);
  if (role === "TRADER") {
    if (!caller.is_primary_owner && !CLIENT_INVITER_ROLES.includes(caller.role)) {
      return jsonResponse({ success: false, error: "Votre rôle ne permet pas d'inviter un client" }, 403);
    }
  } else if (!staffRoles.includes(role)) {
    return jsonResponse(
      {
        success: false,
        error: ["OWNER", "OWNER_A_PLUS", "OWNER_B_PLUS"].includes(role)
          ? "Seul le Super Owner peut attribuer un rôle Owner"
          : "Votre rôle ne permet pas d'attribuer ce rôle",
      },
      403,
    );
  }

  // 4. Compte existant ?
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id, role, status, is_primary_owner, email, name, phone")
    .ilike("email", email.replace(/[\\%_]/g, (c) => `\\${c}`))
    .maybeSingle<Profile>();

  if (existing) {
    if (existing.is_primary_owner || existing.id === caller.id) {
      return jsonResponse({ success: false, error: "Ce compte ne peut pas être modifié depuis cette interface" }, 403);
    }
    if (role === "TRADER") {
      return jsonResponse({ success: false, error: "Un compte existe déjà avec cette adresse e-mail" }, 409);
    }
    if (existing.role === role) {
      return jsonResponse({ success: false, error: `Ce compte a déjà le rôle ${roleLabel(role)}` }, 409);
    }
    // Il faut aussi avoir autorité sur le rôle ACTUEL du compte.
    if (existing.role !== "TRADER" && !staffRoles.includes(existing.role)) {
      return jsonResponse({ success: false, error: "Votre rôle ne permet pas de modifier ce compte" }, 403);
    }
    if (!confirmPromote) {
      return jsonResponse(
        {
          success: false,
          needsConfirmation: true,
          existing: { name: existing.name, role: existing.role, status: existing.status },
          error: "Un compte existe déjà avec cette adresse e-mail",
        },
        409,
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ role, name: existing.name || name, phone: existing.phone || phone })
      .eq("id", existing.id);
    if (updateError) {
      console.error("Erreur attribution de rôle:", updateError);
      return jsonResponse({ success: false, error: "Échec de l'attribution du rôle" }, 500);
    }

    await notifyRoleChange(email, existing.name || name, role);
    await supabaseAdmin.from("audit_logs").insert({
      admin_id: caller.id,
      admin_name: caller.name || caller.email || caller.id,
      action: "STAFF_PROMOTED",
      target_user_id: existing.id,
      target_user_email: email,
      details: {
        message: `Rôle ${existing.role} → ${role} attribué à un compte existant (statut inchangé : ${existing.status}).`,
        previous_role: existing.role,
        new_role: role,
        caller_role: caller.role,
      },
    });
    return jsonResponse({ success: true, promoted: true, id: existing.id, status: existing.status });
  }

  // 5. Nouveau compte : invitation Supabase Auth (e-mail « Invite user »).
  //    Le trigger handle_new_user crée le profil TRADER, puis le rôle est posé.
  const redirectTo = Deno.env.get("INVITE_REDIRECT_URL") || "https://nexiummarkets.com/reset-password";
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name, ...(phone ? { phone } : {}) },
    redirectTo,
  });
  if (inviteError || !inviteData?.user) {
    console.error("Erreur invitation:", inviteError);
    return jsonResponse({ success: false, error: inviteError?.message || "Échec de l'invitation" }, 400);
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    { id: inviteData.user.id, email, name, phone, role, status: "ACTIVE" },
    { onConflict: "id" },
  );
  if (profileError) {
    console.error("Erreur profil invité:", profileError);
    return jsonResponse({ success: false, error: "Invitation envoyée mais profil non configuré" }, 500);
  }

  await supabaseAdmin.from("audit_logs").insert({
    admin_id: caller.id,
    admin_name: caller.name || caller.email || caller.id,
    action: role === "TRADER" ? "CLIENT_INVITED" : "STAFF_INVITED",
    target_user_id: inviteData.user.id,
    target_user_email: email,
    details: { message: `Invitation envoyée — rôle ${role}.`, role, caller_role: caller.role },
  });

  return jsonResponse({ success: true, invited: true, id: inviteData.user.id });
});
// @nexium-lock-end create-account
