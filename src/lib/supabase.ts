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
  /** Vrai uniquement pour le compte Super Owner protégé (au plus un seul profil, imposé côté DB). */
  is_primary_owner?: boolean;
  license_status?: "NOT_REQUESTED" | "PENDING_PRESET_APPROVAL" | "ACTIVE" | "EXPIRED";
  requested_preset?: "AI_GOLD" | "FX_TREND" | "INDEX_REVERSION" | string;
  active_preset?: "AI_GOLD" | "FX_TREND" | "INDEX_REVERSION" | string;
  mt5_login?: string;
  mt5_broker?: string;
  mt5_server?: string;
  mt5_investor_pass?: string;
  balance?: number;
  gross_profit_total?: number;
  gross_loss_total?: number;
  assigned_advisor?: string;
  country?: string;
  max_daily_loss_percent?: number;
  max_simultaneous_trades?: number;
  risk_guard_auto_stop?: boolean;
  engines_config?: Record<string, unknown>;
  license_key?: string;
  license_expires?: string;
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
 * En cas d'absence (ex: retard trigger), tente une insertion de secours sécurisée.
 */
export async function getUserProfile(userId: string): Promise<SupabaseUserProfile | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erreur lors du chargement du profil Supabase:", error);
    return null;
  }

  if (data) return data as SupabaseUserProfile;

  // Fallback si la ligne n'existait pas encore
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      const fallbackName = user.user_metadata?.name || user.email?.split("@")[0] || "Trader";
      const fallbackCountry = user.user_metadata?.country || "France";
      const { data: createdProfile } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email: user.email || "",
          name: fallbackName,
          country: fallbackCountry,
          role: "TRADER",
          status: "PENDING_APPROVAL",
          kyc_status: "PENDING",
          balance: 0.0,
          assigned_advisor: "Desk de Conformité & Risque",
        })
        .select()
        .maybeSingle();

      if (createdProfile) return createdProfile as SupabaseUserProfile;
    }
  } catch (err) {
    console.warn("Fallback profil:", err);
  }

  return null;
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

/**
 * Demande d'activation d'un preset par le client.
 */
export async function requestPresetActivation(userId: string, presetKey: string) {
  return updateUserProfile(userId, {
    license_status: "PENDING_PRESET_APPROVAL",
    requested_preset: presetKey,
  });
}

/**
 * Validation et activation d'un preset par le Super Administrateur.
 */
export async function approvePresetActivation(userId: string, presetKey?: string) {
  const profile = await getUserProfile(userId);
  const finalPreset = presetKey || profile?.requested_preset || "AI_GOLD";
  return updateUserProfile(userId, {
    license_status: "ACTIVE",
    active_preset: finalPreset,
  });
}

/**
 * Attribution d'un client à un Administrateur / Conseiller par le Super Admin.
 */
export async function assignAdvisorToClient(userId: string, advisorName: string) {
  return updateUserProfile(userId, {
    assigned_advisor: advisorName,
  });
}

/**
 * Récupère tous les profils du staff (tout rôle hors TRADER) depuis Supabase.
 */
export async function getAllStaffProfiles(): Promise<SupabaseUserProfile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "TRADER")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur récupération profils staff:", error);
    return [];
  }
  return data as SupabaseUserProfile[];
}

/**
 * Recherche un profil existant par e-mail (utilisé pour promouvoir un compte
 * déjà inscrit vers un rôle staff, plutôt que de fabriquer un profil orphelin
 * non relié à un compte auth.users réel).
 */
export async function findProfileByEmail(email: string): Promise<SupabaseUserProfile | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Erreur recherche profil par e-mail:", error);
    return null;
  }
  return data as SupabaseUserProfile | null;
}

/**
 * Supprime définitivement un profil (staff ou client) de Supabase.
 * Bloqué côté DB par la policy `profiles_delete` pour le Super Owner.
 */
export async function deleteProfile(userId: string) {
  if (!isSupabaseConfigured) return { success: true, simulated: true };
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) {
    console.error("Erreur suppression profil Supabase:", error);
    return { success: false, error };
  }
  return { success: true };
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

/**
 * Récupère le journal d'audit le plus récent (réservé OWNER / SUPER_ADMIN côté RLS).
 */
export async function getAuditLogs(limit = 200): Promise<SupabaseAuditLog[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erreur chargement audit logs Supabase:", error);
    return [];
  }
  return data as SupabaseAuditLog[];
}

/* ==========================================================================
   HELPERS TRANSACTIONS (Dépôts, Retraits, Ajustements)
   ========================================================================== */

export interface SupabaseTransaction {
  id?: string;
  user_id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "PERF_FEE" | "TRADE_PROFIT" | "BONUS" | "DEBIT" | "PROFIT_SHARE" | "PNL_ADJUST";
  amount: number;
  currency?: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED" | "REJECTED";
  method?: string;
  reference_tx?: string;
  created_at?: string;
}

/**
 * Récupère toutes les transactions (Finance/Direction uniquement côté RLS).
 */
export async function getAllTransactions(): Promise<SupabaseTransaction[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur chargement transactions Supabase:", error);
    return [];
  }
  return data as SupabaseTransaction[];
}

/**
 * Enregistre une nouvelle transaction (dépôt manuel, retrait validé, ajustement...).
 */
export async function recordTransaction(entry: Omit<SupabaseTransaction, "id" | "created_at">) {
  if (!isSupabaseConfigured) return { success: true, simulated: true };
  const { data, error } = await supabase.from("transactions").insert([entry]).select().single();
  if (error) {
    console.error("Erreur enregistrement transaction Supabase:", error);
    return { success: false, error };
  }
  return { success: true, data: data as SupabaseTransaction };
}

/**
 * Met à jour le statut d'une transaction existante (validation/rejet d'un retrait).
 */
export async function updateTransactionStatus(txId: string, status: SupabaseTransaction["status"]) {
  if (!isSupabaseConfigured) return { success: true, simulated: true };
  const { error } = await supabase.from("transactions").update({ status }).eq("id", txId);
  if (error) {
    console.error("Erreur mise à jour statut transaction Supabase:", error);
    return { success: false, error };
  }
  return { success: true };
}

/**
 * Met à jour le solde d'un client (crédit/débit manuel, validation dépôt/retrait).
 */
export async function updateClientBalance(userId: string, newBalance: number) {
  return updateUserProfile(userId, { balance: newBalance });
}

/* ==========================================================================
   INVITATION DE COMPTE (CLIENT OU STAFF) DEPUIS L'ADMIN
   ========================================================================== */

/**
 * Appelle une route /api/admin/* du service backend dédié (seul endroit
 * autorisé à détenir la clé service_role) en portant le JWT de l'admin
 * connecté — jamais exécuté côté client sans passer par ce relais.
 */
async function callAdminApi(path: string, body: unknown): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase n'est pas configuré." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, error: "Session administrateur expirée, reconnectez-vous." };
  }

  try {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error || "Échec de l'opération." };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Service d'administration injoignable." };
  }
}

/**
 * Invite une nouvelle personne (client ou staff) : crée son compte de connexion
 * Supabase Auth + son profil, et lui envoie un e-mail avec un lien pour choisir
 * son propre mot de passe.
 */
export async function inviteUser(params: {
  name: string;
  email: string;
  phone?: string;
  role: "OWNER" | "SUPER_ADMIN" | "ADMIN" | "CONSEILLER" | "SUPPORT" | "FINANCE" | "QUANT" | "TRADER";
}): Promise<{ success: boolean; error?: string }> {
  return callAdminApi("/api/admin/invite-user", params);
}

/**
 * Change l'e-mail de connexion d'un compte (client ou staff), confirmé
 * immédiatement — action réservée aux admins.
 */
export async function updateUserEmail(userId: string, newEmail: string): Promise<{ success: boolean; error?: string }> {
  return callAdminApi("/api/admin/update-user-email", { userId, newEmail });
}

/**
 * Définit un nouveau mot de passe pour un compte (dépannage client bloqué).
 */
export async function setUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  return callAdminApi("/api/admin/set-user-password", { userId, newPassword });
}

/**
 * Déconnecte de force toutes les sessions actives d'un compte.
 */
export async function killUserSessions(userId: string): Promise<{ success: boolean; error?: string }> {
  return callAdminApi("/api/admin/kill-sessions", { userId });
}

/* ==========================================================================
   NOTES CRM (STAFF → CLIENT)
   ========================================================================== */

export interface SupabaseCrmNote {
  id?: string;
  user_id: string;
  author_name: string;
  text: string;
  created_at?: string;
}

export async function getCrmNotes(userId: string): Promise<SupabaseCrmNote[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("crm_notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Erreur chargement notes CRM:", error);
    return [];
  }
  return data as SupabaseCrmNote[];
}

export async function addCrmNote(userId: string, authorName: string, text: string) {
  if (!isSupabaseConfigured) return { success: true, simulated: true };
  const { data, error } = await supabase
    .from("crm_notes")
    .insert([{ user_id: userId, author_name: authorName, text }])
    .select()
    .single();
  if (error) {
    console.error("Erreur ajout note CRM:", error);
    return { success: false, error };
  }
  return { success: true, data: data as SupabaseCrmNote };
}

/* ==========================================================================
   HELPERS MESSAGERIE & LIVE CHAT EN TEMPS RÉEL
   ========================================================================== */

export interface SupabaseChatMessage {
  id?: string;
  client_id: string;
  sender: "CLIENT" | "ADMIN" | "VISITOR" | "SYSTEM";
  author_name: string;
  text: string;
  is_read: boolean;
  channel: "CHAT" | "EMAIL";
  created_at?: string;
}

export interface SupabaseLiveChatThread {
  id: string;
  visitor_name: string;
  contact: string;
  language: "fr" | "en";
  status: "QUEUE" | "ACTIVE" | "RESOLVED";
  assigned_advisor?: string | null;
  assigned_advisor_role?: string | null;
  initial_query: string;
  created_at?: string;
  last_activity?: string;
}

/**
 * Récupère tous les fils du routeur de chat depuis Supabase.
 */
export async function getSupabaseLiveChatThreads(): Promise<SupabaseLiveChatThread[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("live_chat_threads")
    .select("*")
    .order("last_activity", { ascending: false });

  if (error) {
    console.warn("Notice chargement live_chat_threads Supabase:", error);
    return [];
  }
  return data as SupabaseLiveChatThread[];
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

/**
 * Récupère tous les messages directs (channel CHAT, hors fils visiteurs web
 * qui n'ont pas de client_id) — utilisé côté admin pour la liste globale.
 */
export async function getAllDirectClientMessages(): Promise<SupabaseChatMessage[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("channel", "CHAT")
    .not("client_id", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erreur chargement messages clients Supabase:", error);
    return [];
  }
  return data as SupabaseChatMessage[];
}

/**
 * Récupère les transactions spécifiques à un utilisateur.
 */
export async function getUserTransactions(userId: string): Promise<SupabaseTransaction[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur chargement transactions utilisateur Supabase:", error);
    return [];
  }
  return data as SupabaseTransaction[];
}

/**
 * Crée une demande de dépôt pour un client (statut PENDING en attente de validation).
 */
export async function createDepositRequest(userId: string, amount: number, method = "Virement SEPA") {
  return recordTransaction({
    user_id: userId,
    type: "DEPOSIT",
    amount,
    currency: "USD",
    status: "PENDING",
    method,
  });
}

/**
 * Crée une demande de retrait pour un client (statut PENDING en attente de validation).
 */
export async function createWithdrawalRequest(userId: string, amount: number, destination = "SEPA / SWIFT", method = "SEPA_IBAN") {
  return recordTransaction({
    user_id: userId,
    type: "WITHDRAWAL",
    amount,
    currency: "USD",
    status: "PENDING",
    method,
    reference_tx: destination,
  });
}

/**
 * Abonnement temps réel aux profils clients (création, mise à jour de statut, KYC...)
 * Utilisé notamment par la console d'administration pour les alertes de nouveaux inscrits.
 */
export function subscribeToProfiles(callback: (payload: any) => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  let channel: any = null;
  try {
    channel = supabase
      .channel("public:profiles:all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => callback(payload)
      )
      .subscribe();
  } catch (err) {
    console.warn("Notice Realtime profiles Supabase:", err);
  }
  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}

/**
 * Abonnement temps réel au profil d'un client précis (écoute d'approbation ou changement de preset).
 */
export function subscribeToUserProfile(userId: string, callback: (profile: SupabaseUserProfile) => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  let channel: any = null;
  try {
    channel = supabase
      .channel(`public:profiles:${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.new) callback(payload.new as SupabaseUserProfile);
        }
      )
      .subscribe();
  } catch (err) {
    console.warn("Notice Realtime user profile Supabase:", err);
  }
  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}

/**
 * Abonnement temps réel aux transactions (créations de dépôts/retraits, validations).
 */
export function subscribeToTransactions(callback: (payload: any) => void, userId?: string): () => void {
  if (!isSupabaseConfigured) return () => {};
  let channel: any = null;
  try {
    channel = supabase
      .channel(userId ? `public:transactions:user:${userId}` : "public:transactions:all")
      .on(
        "postgres_changes",
        userId
          ? { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` }
          : { event: "*", schema: "public", table: "transactions" },
        (payload) => callback(payload)
      )
      .subscribe();
  } catch (err) {
    console.warn("Notice Realtime transactions Supabase:", err);
  }
  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}

/**
 * Abonnement temps réel aux messages directs d'un client précis (ou de tous
 * les clients si clientId est omis, pour la vue admin globale).
 */
export function subscribeToDirectMessages(callback: () => void, clientId?: string): () => void {
  if (!isSupabaseConfigured) return () => {};
  let channel: any = null;
  try {
    channel = supabase
      .channel(clientId ? `public:chat_messages:client:${clientId}` : "public:chat_messages:all")
      .on(
        "postgres_changes",
        clientId
          ? { event: "INSERT", schema: "public", table: "chat_messages", filter: `client_id=eq.${clientId}` }
          : { event: "INSERT", schema: "public", table: "chat_messages" },
        callback
      )
      .subscribe();
  } catch (err) {
    console.warn("Notice Realtime messages Supabase:", err);
  }
  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}

/* ==========================================================================
   HELPERS E-MAILS / SUPPORT TICKETS DU CLIENT
   ========================================================================== */

export interface ClientEmailThread {
  id: string;
  subject: string;
  customer_email: string;
  customer_name?: string;
  preview?: string;
  unread: boolean;
  status: string;
  created_at: string;
  messages: Array<{
    id: string;
    from_address: string;
    to_address: string;
    subject: string;
    body_text: string;
    direction: "INBOUND" | "OUTBOUND";
    created_at: string;
  }>;
}

/**
 * Récupère toutes les conversations e-mails d'un client depuis Supabase.
 */
export async function getClientEmailConversations(userEmail: string): Promise<ClientEmailThread[]> {
  if (!isSupabaseConfigured || !userEmail) return [];
  const { data: convs, error } = await supabase
    .from("email_conversations")
    .select("*")
    .eq("customer_email", userEmail.trim().toLowerCase())
    .order("created_at", { ascending: false });

  if (error || !convs) return [];

  const convIds = convs.map((c) => c.id);
  if (convIds.length === 0) return [];

  const { data: msgs } = await supabase
    .from("email_messages")
    .select("*")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: true });

  return convs.map((c) => ({
    id: c.id,
    subject: c.subject,
    customer_email: c.customer_email,
    customer_name: c.customer_name,
    preview: c.preview,
    unread: c.unread,
    status: c.status,
    created_at: c.created_at,
    messages: (msgs || []).filter((m) => m.conversation_id === c.id),
  }));
}

/**
 * Envoie un e-mail / ticket depuis le dashboard client vers le Desk Admin.
 */
export async function sendClientEmailMessage(params: {
  customerEmail: string;
  customerName: string;
  subject: string;
  message: string;
  toAddress?: string;
}) {
  if (!isSupabaseConfigured) return { success: true, simulated: true };
  const convId = `thread-${Date.now().toString().slice(-6)}`;
  const preview = params.message.slice(0, 100);

  const { error: convErr } = await supabase.from("email_conversations").insert([
    {
      id: convId,
      subject: params.subject,
      status: "INBOX",
      customer_email: params.customerEmail.trim().toLowerCase(),
      customer_name: params.customerName,
      preview,
      unread: true,
    },
  ]);

  if (convErr) {
    console.error("Erreur création email_conversation:", convErr);
    return { success: false, error: convErr };
  }

  const { error: msgErr } = await supabase.from("email_messages").insert([
    {
      conversation_id: convId,
      from_address: params.customerEmail.trim().toLowerCase(),
      to_address: params.toAddress || "support@nexiummarkets.com",
      subject: params.subject,
      body_text: params.message,
      direction: "INBOUND",
    },
  ]);

  if (msgErr) {
    console.error("Erreur création email_message:", msgErr);
    return { success: false, error: msgErr };
  }

  return { success: true, conversationId: convId };
}

/**
 * Abonnement temps réel aux e-mails et réponses du Desk pour un client.
 */
export function subscribeToClientEmails(callback: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  let channel: any = null;
  try {
    channel = supabase
      .channel("public:email_messages:client")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "email_messages" },
        callback
      )
      .subscribe();
  } catch (err) {
    console.warn("Notice Realtime email messages Supabase:", err);
  }
  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}




