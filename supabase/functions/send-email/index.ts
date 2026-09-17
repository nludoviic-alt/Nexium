// Relais serveur pour l'envoi d'e-mails transactionnels via Resend.
//
// Avant cette fonction, src/lib/resend.ts appelait https://api.resend.com/emails
// DIRECTEMENT depuis le navigateur, avec la clé API Resend embarquée dans le
// bundle JS public (VITE_RESEND_API_KEY). N'importe quel visiteur pouvait donc
// récupérer cette clé (DevTools → Sources ou onglet Réseau) et l'utiliser pour
// envoyer des e-mails au nom du domaine — spam, phishing, épuisement de quota.
//
// Cette fonction garde la clé Resend uniquement côté serveur (secret de
// fonction, jamais exposé) et fait l'appel à Resend elle-même. Le client
// n'a plus besoin de connaître la clé — il envoie juste {to, subject, html}.
//
// Déploiement : voir supabase/functions/send-email/README.md

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_FROM = "Nexium Markets <support@nexiummarkets.com>";
const MAX_HTML_LENGTH = 200_000;

interface SendEmailBody {
  to?: string;
  subject?: string;
  html?: string;
  from?: string;
}

function jsonResponse(body: unknown, status: number) {
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
    return jsonResponse({ success: false, error: "method_not_allowed" }, 405);
  }

  let body: SendEmailBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "invalid_body" }, 400);
  }

  const { to, subject, html } = body;
  if (!to || !subject || !html) {
    return jsonResponse({ success: false, error: "missing_fields" }, 400);
  }
  if (html.length > MAX_HTML_LENGTH) {
    return jsonResponse({ success: false, error: "html_too_large" }, 400);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("RESEND_API_KEY manquant — configurez ce secret sur la fonction send-email.");
    return jsonResponse({ success: false, error: "not_configured" }, 500);
  }

  const from = body.from || Deno.env.get("RESEND_FROM_EMAIL") || DEFAULT_FROM;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
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
