// Garde-fou anti-spam serveur pour le formulaire de contact public.
//
// Le formulaire (src/routes/contact.tsx) fait déjà 3 vérifications côté
// navigateur (honeypot, délai minimum, limite de fréquence stockée en
// localStorage) — mais un bot déterminé peut vider son localStorage ou
// naviguer en mode privé pour les contourner. Cette fonction rejoue les
// mêmes vérifications côté serveur, où elles ne peuvent pas être bypassées,
// et ajoute une limite de fréquence par IP qui n'existe pas côté client.
//
// Elle NE remplace PAS les insertions Supabase existantes (email_conversations,
// email_messages) faites par contact.tsx : elle sert uniquement de portillon
// appelé AVANT elles. Si l'appel échoue (fonction pas encore déployée, réseau
// coupé...), contact.tsx doit laisser passer la soumission (fail-open) pour ne
// jamais bloquer un client légitime à cause d'un souci d'infrastructure.
//
// Déploiement : voir supabase/functions/contact-submit/README.md

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_SUBMISSIONS_PER_WINDOW = 4;
const WINDOW_MINUTES = 10;
const MIN_ELAPSED_SECONDS = 1.8;

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ allowed: false, reason: "method_not_allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let body: { honeypot?: string; elapsedSeconds?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ allowed: false, reason: "invalid_body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // 1. Honeypot : un champ que seul un robot remplit.
  if (body.honeypot && body.honeypot.trim().length > 0) {
    return new Response(JSON.stringify({ allowed: false, reason: "honeypot" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // 2. Délai minimum : un humain ne peut pas remplir le formulaire en < 1.8s.
  if (typeof body.elapsedSeconds !== "number" || body.elapsedSeconds < MIN_ELAPSED_SECONDS) {
    return new Response(JSON.stringify({ allowed: false, reason: "too_fast" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // 3. Limite de fréquence par IP (le client ne peut pas la contourner en vidant son storage).
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
  const ipHash = await hashIp(ip);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    // Config manquante côté fonction : on laisse passer plutôt que de bloquer
    // tout le monde à cause d'un secret non configuré.
    return new Response(JSON.stringify({ allowed: true, reason: "not_configured" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from("contact_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStart);

  if (countError) {
    console.error("Erreur lecture contact_rate_limits:", countError);
    return new Response(JSON.stringify({ allowed: true, reason: "check_failed_open" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if ((count ?? 0) >= MAX_SUBMISSIONS_PER_WINDOW) {
    return new Response(JSON.stringify({ allowed: false, reason: "rate_limited" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  await supabase.from("contact_rate_limits").insert([{ ip_hash: ipHash }]);

  return new Response(JSON.stringify({ allowed: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
