import http from "node:http";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Nexium Markets <support@nexiummarkets.com>";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const INVITE_REDIRECT_URL = process.env.INVITE_REDIRECT_URL || "https://nexiummarkets.com/reset-password";

const ADMIN_CONSOLE_ROLES = ["OWNER", "SUPER_ADMIN", "ADMIN", "CONSEILLER", "SUPPORT", "FINANCE", "QUANT"];
const ALL_ROLES = [...ADMIN_CONSOLE_ROLES, "TRADER"];

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

// Résout l'appelant (JWT utilisateur) puis vérifie son rôle admin réel dans
// `profiles` — jamais fait confiance à un rôle envoyé par le client.
async function authenticateAdminCaller(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Authentification manquante.", status: 401 };
  }
  const callerToken = authHeader.slice("Bearer ".length);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${callerToken}`,
    },
  });
  if (!userRes.ok) {
    return { error: "Session invalide ou expirée.", status: 401 };
  }
  const callerUser = await userRes.json();

  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUser.id}&select=id,role,status,is_primary_owner`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const profiles = await profileRes.json();
  const callerProfile = Array.isArray(profiles) ? profiles[0] : null;

  if (!callerProfile || !ADMIN_CONSOLE_ROLES.includes(callerProfile.role) || callerProfile.status !== "ACTIVE") {
    return { error: "Droits administrateur requis.", status: 403 };
  }

  return { callerProfile };
}

async function getProfileById(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}&select=id,role,is_primary_owner,email`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

// Un OWNER classique ne peut pas toucher un autre OWNER ni le Super Owner —
// seul le Super Owner peut agir sur un compte OWNER (hors lui-même).
function isTargetProtectedFromCaller(callerProfile, targetProfile) {
  if (!targetProfile) return "Compte cible introuvable.";
  const actingOnSelf = callerProfile.id === targetProfile.id;
  if (targetProfile.is_primary_owner && !actingOnSelf) {
    return "Compte Super Owner protégé.";
  }
  if (targetProfile.role === "OWNER" && !actingOnSelf && !callerProfile.is_primary_owner) {
    return "Seul le Super Owner peut agir sur un compte OWNER.";
  }
  return null;
}

async function handleInviteUser(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Service d'invitation non configuré côté serveur." }));
    return;
  }

  try {
    const auth = await authenticateAdminCaller(req.headers.authorization);
    if (auth.error) {
      res.writeHead(auth.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: auth.error }));
      return;
    }

    const { name, email, phone, role } = await readJsonBody(req);
    if (!name || !email || !role) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Nom, e-mail et rôle sont requis." }));
      return;
    }
    if (!ALL_ROLES.includes(role)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Rôle invalide." }));
      return;
    }
    if (role === "OWNER" && !auth.callerProfile.is_primary_owner) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Seul le Super Owner peut désigner un rôle OWNER." }));
      return;
    }

    const inviteRes = await fetch(
      `${SUPABASE_URL}/auth/v1/invite?redirect_to=${encodeURIComponent(INVITE_REDIRECT_URL)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ email, data: { name } }),
      }
    );
    const invited = await inviteRes.json();
    if (!inviteRes.ok) {
      res.writeHead(inviteRes.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: invited?.msg || invited?.error_description || "Échec de l'invitation." }));
      return;
    }

    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: invited.id,
        email,
        name,
        phone: phone || null,
        role,
        status: "ACTIVE",
        kyc_status: "NOT_SUBMITTED",
      }),
    });
    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      res.writeHead(profileRes.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Compte invité mais échec de la création du profil.", details: profileData }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, id: invited.id }));
  } catch (err) {
    console.error("Invite user error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// Changement d'e-mail de connexion d'un client/staff par un admin. Le nouvel
// e-mail est confirmé directement (email_confirm: true) — pas de double
// confirmation, l'admin a déjà vérifié l'identité de la personne.
async function handleUpdateUserEmail(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Service non configuré côté serveur." }));
    return;
  }
  try {
    const auth = await authenticateAdminCaller(req.headers.authorization);
    if (auth.error) {
      res.writeHead(auth.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: auth.error }));
      return;
    }

    const { userId, newEmail } = await readJsonBody(req);
    if (!userId || !newEmail) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "userId et newEmail sont requis." }));
      return;
    }

    const target = await getProfileById(userId);
    const blocked = isTargetProtectedFromCaller(auth.callerProfile, target);
    if (blocked) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: blocked }));
      return;
    }

    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email: newEmail, email_confirm: true }),
    });
    const authData = await authRes.json();
    if (!authRes.ok) {
      res.writeHead(authRes.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: authData?.msg || "Échec du changement d'e-mail." }));
      return;
    }

    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email: newEmail }),
    });
    if (!profileRes.ok) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "E-mail changé côté connexion mais échec de la synchronisation du profil." }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error("Update email error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// Définit un nouveau mot de passe pour un compte, choisi par l'admin (ex:
// dépannage d'un client bloqué). Invalide au passage ses sessions actives
// (comportement standard de GoTrue lors d'un changement de mot de passe).
async function handleSetUserPassword(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Service non configuré côté serveur." }));
    return;
  }
  try {
    const auth = await authenticateAdminCaller(req.headers.authorization);
    if (auth.error) {
      res.writeHead(auth.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: auth.error }));
      return;
    }

    const { userId, newPassword } = await readJsonBody(req);
    if (!userId || !newPassword || newPassword.length < 8) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "userId et un mot de passe d'au moins 8 caractères sont requis." }));
      return;
    }

    const target = await getProfileById(userId);
    const blocked = isTargetProtectedFromCaller(auth.callerProfile, target);
    if (blocked) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: blocked }));
      return;
    }

    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });
    const authData = await authRes.json();
    if (!authRes.ok) {
      res.writeHead(authRes.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: authData?.msg || "Échec de la mise à jour du mot de passe." }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error("Set password error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// Déconnecte de force toutes les sessions actives d'un utilisateur. GoTrue
// n'expose pas de route dédiée "kill sessions" — on obtient le même effet en
// lui attribuant un nouveau mot de passe aléatoire côté serveur (invalide
// tous ses jetons existants), sans jamais faire transiter ce mot de passe
// ailleurs qu'ici : la personne devra utiliser "Mot de passe oublié" pour
// revenir dans son compte.
async function handleKillSessions(req, res) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Service non configuré côté serveur." }));
    return;
  }
  try {
    const auth = await authenticateAdminCaller(req.headers.authorization);
    if (auth.error) {
      res.writeHead(auth.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: auth.error }));
      return;
    }

    const { userId } = await readJsonBody(req);
    if (!userId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "userId requis." }));
      return;
    }

    const target = await getProfileById(userId);
    const blocked = isTargetProtectedFromCaller(auth.callerProfile, target);
    if (blocked) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: blocked }));
      return;
    }

    const randomPassword = Array.from({ length: 24 }, () => Math.random().toString(36)[2] || "x").join("");
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ password: randomPassword }),
    });
    if (!authRes.ok) {
      const authData = await authRes.json();
      res.writeHead(authRes.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: authData?.msg || "Échec de la déconnexion forcée." }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error("Kill sessions error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handleSendEmail(req, res) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      const { to, subject, html } = JSON.parse(body);
      if (!to || !subject || !html) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required fields" }));
        return;
      }

      const recipients = Array.isArray(to) ? to : [to];

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: recipients,
          subject,
          html,
        }),
      });

      const data = await response.json();
      res.writeHead(response.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error("Mailer error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && (req.url === "/api/send-email" || req.url === "/")) {
    await handleSendEmail(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/admin/invite-user") {
    await handleInviteUser(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/admin/update-user-email") {
    await handleUpdateUserEmail(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/admin/set-user-password") {
    await handleSetUserPassword(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/admin/kill-sessions") {
    await handleKillSessions(req, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(4000, "127.0.0.1", () => {
  console.log("Mailer service listening on 127.0.0.1:4000");
});
