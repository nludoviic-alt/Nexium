import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Variables d'environnement Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Indique si Supabase est correctement configuré avec des clés réelles.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project-id")
);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  console.info(
    "ℹ️ [Nexium Markets] Supabase n'est pas encore connecté à des clés réelles. " +
    "L'application utilise le mode local/simulation. " +
    "Pour connecter votre base Supabase, renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env.local."
  );
}

/**
 * Client Supabase officiel.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/* ==========================================================================
   HELPERS TYPÉS D'AUTHENTIFICATION & PROFIL
   ========================================================================== */

export interface SupabaseUserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "OWNER" | "SUPER_ADMIN" | "ADMIN" | "CONSEILLER" | "SUPPORT" | "FINANCE" | "QUANT" | "TRADER";
  status: "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "BANNED" | "REVOKED";
  kyc_status: "VERIFIED" | "PENDING" | "REJECTED" | "NOT_SUBMITTED";
  mt5_login?: string;
  mt5_broker?: string;
  balance?: number;
  gross_profit_total?: number;
  gross_loss_total?: number;
  assigned_advisor?: string;
  created_at?: string;
}

/**
 * Récupère la session actuelle de l'utilisateur connecté.
 */
export async function getCurrentSession() {
  if (!isSupabaseConfigured) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Erreur lors de la récupération de la session Supabase:", error);
    return null;
  }
  return session;
}

/**
 * Récupère le profil enrichi de l'utilisateur depuis la table `profiles`.
 */
export async function getUserProfile(userId: string): Promise<SupabaseUserProfile | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Erreur lors du chargement du profil Supabase:", error);
    return null;
  }
  return data as SupabaseUserProfile;
}

/**
 * Met à jour les informations du profil utilisateur.
 */
export async function updateUserProfile(userId: string, updates: Partial<SupabaseUserProfile>) {
  if (!isSupabaseConfigured) return { success: true, simulated: true };
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Erreur lors de la mise à jour du profil Supabase:", error);
    return { success: false, error };
  }
  return { success: true, data };
}

/**
 * Récupère tous les profils de clients depuis Supabase.
 */
export async function getAllClientProfiles(): Promise<SupabaseUserProfile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "TRADER")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur récupération profils clients:", error);
    return [];
  }
  return data as SupabaseUserProfile[];
}

/**
 * Approuve et active le compte d'un client.
 */
export async function approveClientAccount(userId: string, customLogin?: string) {
  const mt5Login = customLogin || `${Math.floor(100000 + Math.random() * 900000)}`;
  return updateUserProfile(userId, {
    status: "ACTIVE",
    kyc_status: "VERIFIED",
    mt5_login: mt5Login,
  });
}

/**
 * Rejette ou révoque le compte d'un client.
 */
export async function rejectClientAccount(userId: string) {
  return updateUserProfile(userId, {
    status: "REVOKED",
    kyc_status: "REJECTED",
  });
}

/* ==========================================================================
   HELPERS LOGS D'AUDIT & SÉCURITÉ
   ========================================================================== */

export interface SupabaseAuditLog {
  id?: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_user_id?: string;
  target_user_email?: string;
  details?: Record<string, any> | string;
  ip_address?: string;
  created_at?: string;
}

/**
 * Enregistre une entrée dans le journal d'audit immuable.
 */
export async function recordAuditLog(entry: Omit<SupabaseAuditLog, "id" | "created_at">) {
  if (!isSupabaseConfigured) {
    console.debug("[Audit Log local]", entry);
    return { success: true, simulated: true };
  }

  const { error } = await supabase.from("audit_logs").insert([entry]);
  if (error) {
    console.error("Erreur enregistrement audit log Supabase:", error);
    return { success: false, error };
  }
  return { success: true };
}

/* ==========================================================================
   HELPERS MESSAGERIE & LIVE CHAT EN TEMPS RÉEL
   ========================================================================== */

export interface SupabaseChatMessage {
  id?: string;
  client_id: string;
  sender_type: "CLIENT" | "DESK" | "AI" | "SYSTEM";
  sender_name: string;
  message_text: string;
  is_read: boolean;
  channel: "CHAT" | "EMAIL";
  created_at?: string;
}

/**
 * Récupère les messages d'un fil de discussion client.
 */
export async function getClientChatMessages(clientId: string): Promise<SupabaseChatMessage[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erreur chargement messages Supabase:", error);
    return [];
  }
  return data as SupabaseChatMessage[];
}

/**
 * Envoie un message dans le chat en direct.
 */
export async function sendChatMessage(msg: Omit<SupabaseChatMessage, "id" | "created_at">) {
  if (!isSupabaseConfigured) return { success: true, simulated: true };
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([msg])
    .select()
    .single();

  if (error) {
    console.error("Erreur envoi message Supabase:", error);
    return { success: false, error };
  }
  return { success: true, data };
}
