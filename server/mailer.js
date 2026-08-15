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
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUser.id}&select=role,status,is_primary_owner`,
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

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(4000, "127.0.0.1", () => {
  console.log("Mailer service listening on 127.0.0.1:4000");
});
