// Relais serveur pour l'envoi d'e-mails transactionnels via Resend.
//
// Avant cette fonction, src/lib/resend.ts appelait https://api.resend.com/emails
// DIRECTEMENT depuis le navigateur, avec la clé API Resend embarquée dans le
// bundle JS public (VITE_RESEND_API_KEY). N'importe quel visiteur pouvait donc
// récupérer cette clé (DevTools → Sources ou onglet Réseau) et l'utiliser pour
// envoyer des e-mails au nom du domaine — spam, phishing, épuisement de quota.
//
// Cette fonction garde la clé Resend uniquement côté serveur (secret de
// fonction, jamais exposé) et fait l'appel à Resend elle-même.
//
// Contrôle d'accès (le relais n'est plus ouvert à tous) :
//   - Staff actif (ADMIN_ROLES, statut ACTIVE) : n'importe quel destinataire.
//   - Client connecté : uniquement la boîte interne ou sa propre adresse.
//   - Visiteur anonyme : uniquement la boîte interne (alertes inscription,
//     formulaire de contact, escalade chatbot).
//   Les non-staff sont limités en fréquence (par utilisateur ou par IP).
//   L'expéditeur est toujours imposé par le serveur (champ `from` ignoré).
//
// Déploiement : voir supabase/functions/send-email/README.md

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_FROM = "Nexium Markets <support@nexiummarkets.com>";
const DEFAULT_INTERNAL_RECIPIENTS = "support@nexiummarkets.com";
const MAX_HTML_LENGTH = 200_000;
const MAX_SUBJECT_LENGTH = 300;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Limite de fréquence pour les appelants non-staff.
const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_MAX_SENDS = 10;

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

interface SendEmailBody {
  to?: unknown;
  subject?: unknown;
  html?: unknown;
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "method_not_allowed" }, 405);
  }

  let body: SendEmailBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "invalid_body" }, 400);
  }

  const { to, subject, html } = body;
  // `to` doit être UNE adresse (Resend accepte aussi des tableaux, ce qui
  // permettrait de contourner le contrôle des destinataires).
  if (typeof to !== "string" || typeof subject !== "string" || typeof html !== "string" || !to || !subject || !html) {
    return jsonResponse({ success: false, error: "missing_fields" }, 400);
  }
  const recipient = to.trim().toLowerCase();
  if (!EMAIL_REGEX.test(recipient)) {
    return jsonResponse({ success: false, error: "invalid_recipient" }, 400);
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return jsonResponse({ success: false, error: "subject_too_long" }, 400);
  }
  if (html.length > MAX_HTML_LENGTH) {
    return jsonResponse({ success: false, error: "html_too_large" }, 400);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!resendApiKey || !supabaseUrl || !serviceRoleKey) {
    console.error("Secrets manquants sur send-email (RESEND_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    return jsonResponse({ success: false, error: "not_configured" }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Identification de l'appelant. Une clé anon/publishable n'est pas une
  //    session utilisateur : getUser échoue et l'appelant est traité en anonyme.
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  let callerId: string | null = null;
  let callerEmail: string | null = null;
  let isStaff = false;

  if (token) {
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (userData?.user) {
      callerId = userData.user.id;
      callerEmail = userData.user.email?.toLowerCase() || null;
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, status")
        .eq("id", callerId)
        .maybeSingle();
      isStaff = Boolean(profile && ADMIN_ROLES.includes(profile.role) && profile.status === "ACTIVE");
    }
  }

  // 2. Contrôle du destinataire pour les non-staff.
  if (!isStaff) {
    const internalRecipients = (Deno.env.get("INTERNAL_NOTIFICATION_EMAILS") || DEFAULT_INTERNAL_RECIPIENTS)
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const allowed = internalRecipients.includes(recipient) || (callerEmail !== null && recipient === callerEmail);
    if (!allowed) {
      return jsonResponse({ success: false, error: "recipient_not_allowed" }, 403);
    }

    // 3. Limite de fréquence (table contact_rate_limits, clé préfixée pour ne
    //    pas se mélanger avec le compteur du formulaire de contact).
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
    const rateKey = await sha256Hex(callerId ? `send-email:user:${callerId}` : `send-email:ip:${ip}`);
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count, error: countError } = await supabaseAdmin
      .from("contact_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", rateKey)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("Erreur lecture contact_rate_limits:", countError);
    } else if ((count ?? 0) >= RATE_LIMIT_MAX_SENDS) {
      return jsonResponse({ success: false, error: "rate_limited" }, 429);
    }
    await supabaseAdmin.from("contact_rate_limits").insert([{ ip_hash: rateKey }]);
  }

  // 4. Envoi via Resend avec l'expéditeur imposé par le serveur.
  const from = Deno.env.get("RESEND_FROM_EMAIL") || DEFAULT_FROM;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: recipient, subject, html }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("Erreur Resend:", data);
      return jsonResponse({ success: false, error: data?.message || `HTTP ${res.status}` }, 502);
    }

    return jsonResponse({ success: true, id: data?.id }, 200);
  } catch (err) {
    console.error("Erreur réseau appel Resend:", err);
    return jsonResponse({ success: false, error: "network_error" }, 502);
  }
});
