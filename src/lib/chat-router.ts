/**
 * Routeur Intelligent de Chat en Direct pour Nexium Markets.
 * Gère la file d'attente (Claim Queue) et la distribution entre conseillers.
 * Supabase (`live_chat_threads` + `chat_messages`) est la seule source de
 * vérité — partagée entre le widget public et la console admin, avec
 * synchronisation temps réel via Supabase Realtime.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface LiveChatMessageItem {
  id: string;
  sender: "VISITOR" | "ADVISOR" | "SYSTEM";
  authorName: string;
  text: string;
  timestamp: string;
}

export interface LiveChatThread {
  id: string;
  visitorName: string;
  contact: string; // E-mail ou Téléphone
  language: "fr" | "en";
  status: "QUEUE" | "ACTIVE" | "RESOLVED";
  assignedAdvisor: string | null;
  assignedAdvisorRole?: string | undefined;
  createdAt: string;
  lastActivity: string;
  initialQuery: string;
  messages: LiveChatMessageItem[];
}

function toMessageSender(dbSender: string): LiveChatMessageItem["sender"] {
  if (dbSender === "VISITOR") return "VISITOR";
  if (dbSender === "ADMIN") return "ADVISOR";
  return "SYSTEM";
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR").slice(0, 5);
}

/**
 * Récupère tous les fils de chat depuis Supabase, avec leurs messages.
 */
export async function getLiveChatThreads(): Promise<LiveChatThread[]> {
  if (!isSupabaseConfigured) return [];

  const { data: threads, error: threadsError } = await supabase
    .from("live_chat_threads")
    .select("*")
    .order("last_activity", { ascending: false });
  if (threadsError || !threads) {
    console.warn("Notice chargement live_chat_threads:", threadsError);
    return [];
  }

  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("channel", "CHAT")
    .order("created_at", { ascending: true });
  if (messagesError) {
    console.warn("Notice chargement chat_messages:", messagesError);
  }

  return threads.map((t): LiveChatThread => ({
    id: t.id,
    visitorName: t.visitor_name,
    contact: t.contact,
    language: t.language,
    status: t.status,
    assignedAdvisor: t.assigned_advisor,
    assignedAdvisorRole: t.assigned_advisor_role || undefined,
    createdAt: t.created_at,
    lastActivity: t.last_activity,
    initialQuery: t.initial_query,
    messages: (messages || [])
      .filter((m: any) => m.thread_id === t.id)
      .map((m: any): LiveChatMessageItem => ({
        id: m.id,
        sender: toMessageSender(m.sender),
        authorName: m.author_name,
        text: m.text,
        timestamp: formatTime(m.created_at),
      })),
  }));
}

/**
 * Crée un nouveau fil de chat pour un visiteur public demandant un opérateur.
 */
export async function createLiveChatThread(params: {
  visitorName?: string | undefined;
  contact: string;
  initialQuery: string;
  language: "fr" | "en";
}): Promise<LiveChatThread | null> {
  if (!isSupabaseConfigured) return null;

  const newId = `lead-${Date.now().toString().slice(-6)}`;
  const vName = params.visitorName?.trim() || (params.language === "fr" ? `Visiteur #${newId.slice(-4)}` : `Visitor #${newId.slice(-4)}`);
  const query = params.initialQuery.trim() || "Demande de contact immédiat";
  const nowIso = new Date().toISOString();

  const { error: threadError } = await supabase.from("live_chat_threads").insert([
    {
      id: newId,
      visitor_name: vName,
      contact: params.contact.trim(),
      language: params.language,
      status: "QUEUE",
      initial_query: query,
      created_at: nowIso,
      last_activity: nowIso,
    },
  ]);
  if (threadError) {
    console.warn("Notice création fil chat Supabase:", threadError);
    return null;
  }

  const { error: msgError } = await supabase.from("chat_messages").insert([
    {
      thread_id: newId,
      sender: "VISITOR",
      author_name: vName,
      channel: "CHAT",
      text: query,
      is_read: false,
    },
  ]);
  if (msgError) console.warn("Notice message initial chat Supabase:", msgError);

  return {
    id: newId,
    visitorName: vName,
    contact: params.contact.trim(),
    language: params.language,
    status: "QUEUE",
    assignedAdvisor: null,
    createdAt: nowIso,
    lastActivity: nowIso,
    initialQuery: query,
    messages: [{ id: `msg-${Date.now()}`, sender: "VISITOR", authorName: vName, text: query, timestamp: formatTime(nowIso) }],
  };
}

/**
 * Un conseiller prend en charge un fil de la file d'attente (Claim).
 */
export async function claimLiveChatThread(
  threadId: string,
  advisorName: string,
  advisorRole?: string
): Promise<LiveChatThread | null> {
  if (!isSupabaseConfigured) return null;

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("live_chat_threads")
    .update({
      status: "ACTIVE",
      assigned_advisor: advisorName,
      assigned_advisor_role: advisorRole || "Desk Advisor",
      last_activity: nowIso,
    })
    .eq("id", threadId);
  if (updateError) {
    console.warn("Notice claim Supabase:", updateError);
    return null;
  }

  await supabase.from("chat_messages").insert([
    {
      thread_id: threadId,
      sender: "SYSTEM",
      author_name: "Desk Router",
      channel: "CHAT",
      text: `${advisorName} (${advisorRole || "Conseiller Desk"}) a pris en charge la conversation.`,
      is_read: true,
    },
  ]);

  const threads = await getLiveChatThreads();
  return threads.find((t) => t.id === threadId) || null;
}

/**
 * Envoie un message dans un fil de discussion.
 */
export async function sendLiveChatMessage(params: {
  threadId: string;
  sender: "VISITOR" | "ADVISOR";
  authorName: string;
  text: string;
}): Promise<LiveChatThread | null> {
  if (!isSupabaseConfigured) return null;

  const nowIso = new Date().toISOString();
  const { error: msgError } = await supabase.from("chat_messages").insert([
    {
      thread_id: params.threadId,
      sender: params.sender === "VISITOR" ? "VISITOR" : "ADMIN",
      author_name: params.authorName,
      channel: "CHAT",
      text: params.text.trim(),
      is_read: params.sender === "ADVISOR",
    },
  ]);
  if (msgError) {
    console.warn("Notice envoi message chat Supabase:", msgError);
    return null;
  }

  await supabase.from("live_chat_threads").update({ last_activity: nowIso }).eq("id", params.threadId);

  const threads = await getLiveChatThreads();
  return threads.find((t) => t.id === params.threadId) || null;
}

/**
 * Clôture un fil de discussion une fois résolu.
 */
export async function resolveLiveChatThread(threadId: string): Promise<LiveChatThread | null> {
  if (!isSupabaseConfigured) return null;

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("live_chat_threads")
    .update({ status: "RESOLVED", last_activity: nowIso })
    .eq("id", threadId);
  if (updateError) {
    console.warn("Notice résolution fil Supabase:", updateError);
    return null;
  }

  await supabase.from("chat_messages").insert([
    {
      thread_id: threadId,
      sender: "SYSTEM",
      author_name: "Desk Router",
      channel: "CHAT",
      text: "La session de chat a été clôturée avec succès.",
      is_read: true,
    },
  ]);

  const threads = await getLiveChatThreads();
  return threads.find((t) => t.id === threadId) || null;
}

/**
 * Hook d'abonnement aux événements temps réel du Live Chat (Supabase Realtime).
 * Partagé entre le widget public et la console admin : un message ou un fil
 * modifié par l'un est immédiatement visible chez l'autre.
 */
export function subscribeToLiveChatUpdates(
  callback: (threads: LiveChatThread[]) => void
): () => void {
  if (!isSupabaseConfigured) return () => {};

  const refresh = () => {
    getLiveChatThreads().then(callback);
  };

  let channel: any = null;
  try {
    channel = supabase
      .channel("public:live_chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_chat_threads" }, refresh)
      .subscribe();
  } catch (realtimeErr) {
    console.warn("Notice Realtime Supabase:", realtimeErr);
  }

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}
