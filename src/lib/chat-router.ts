/**
 * Routeur Intelligent de Chat en Direct pour Nexium Markets.
 * Gère la file d'attente (Claim Queue), la distribution entre conseillers,
 * avec synchronisation Supabase (Database + Realtime WebSockets) et fallback local réactif.
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

const STORAGE_KEY = "nexium_live_chat_threads_v1";

const DEFAULT_THREADS: LiveChatThread[] = [
  {
    id: "lead-9821",
    visitorName: "Marc Dubreuil",
    contact: "m.dubreuil@finance-corp.fr",
    language: "fr",
    status: "QUEUE",
    assignedAdvisor: null,
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    initialQuery: "Bonjour, je souhaite des précisions sur le robot Nexium AI Gold et les licences multi-comptes.",
    messages: [
      {
        id: "msg-init-1",
        sender: "VISITOR",
        authorName: "Marc Dubreuil",
        text: "Bonjour, je souhaite des précisions sur le robot Nexium AI Gold et les licences multi-comptes.",
        timestamp: "13:48",
      },
    ],
  },
  {
    id: "lead-9820",
    visitorName: "Elena Rostova",
    contact: "+41 79 482 19 02",
    language: "en",
    status: "ACTIVE",
    assignedAdvisor: "Marc V.",
    assignedAdvisorRole: "Senior Algorithmic Advisor",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    initialQuery: "Hello, what is the average latency from Zurich to your NY4 Equinix fiber cross-connect?",
    messages: [
      {
        id: "msg-init-2",
        sender: "VISITOR",
        authorName: "Elena Rostova",
        text: "Hello, what is the average latency from Zurich to your NY4 Equinix fiber cross-connect?",
        timestamp: "13:36",
      },
      {
        id: "msg-sys-1",
        sender: "SYSTEM",
        authorName: "Desk Router",
        text: "Marc V. (Senior Algorithmic Advisor) a rejoint la conversation.",
        timestamp: "13:37",
      },
      {
        id: "msg-adv-1",
        sender: "ADVISOR",
        authorName: "Marc V.",
        text: "Hello Elena, our direct fiber cross-connect provides an execution latency under 38ms with sub-millisecond internal routing.",
        timestamp: "13:38",
      },
    ],
  },
];

export function getLiveChatThreads(): LiveChatThread[] {
  if (typeof window === "undefined") return DEFAULT_THREADS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_THREADS));
      return DEFAULT_THREADS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Notice lecture storage chat:", err);
    return DEFAULT_THREADS;
  }
}

function saveThreadsAndNotify(threads: LiveChatThread[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    window.dispatchEvent(new CustomEvent("nexium_live_chat_update", { detail: threads }));
  } catch (err) {
    console.warn("Notice sauvegarde storage chat:", err);
  }
}

/**
 * Crée un nouveau fil de chat pour un visiteur public demandant un opérateur.
 */
export function createLiveChatThread(params: {
  visitorName?: string | undefined;
  contact: string;
  initialQuery: string;
  language: "fr" | "en";
}): LiveChatThread {
  const threads = getLiveChatThreads();
  const timeStr = new Date().toLocaleTimeString("fr-FR").slice(0, 5);
  const newId = `lead-${Date.now().toString().slice(-4)}`;
  const vName = params.visitorName?.trim() || (params.language === "fr" ? `Visiteur #${newId.slice(-4)}` : `Visitor #${newId.slice(-4)}`);

  const newThread: LiveChatThread = {
    id: newId,
    visitorName: vName,
    contact: params.contact.trim(),
    language: params.language,
    status: "QUEUE",
    assignedAdvisor: null,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    initialQuery: params.initialQuery.trim() || "Demande de contact immédiat",
    messages: [
      {
        id: `msg-${Date.now()}-1`,
        sender: "VISITOR",
        authorName: vName,
        text: params.initialQuery.trim() || "Demande de mise en relation avec un opérateur",
        timestamp: timeStr,
      },
    ],
  };

  const updated = [newThread, ...threads.filter((t) => t.id !== newId)];
  saveThreadsAndNotify(updated);

  // Synchronisation Supabase si connecté
  if (isSupabaseConfigured) {
    supabase
      .from("chat_messages")
      .insert([
        {
          client_id: newId,
          sender: "CLIENT",
          author_name: vName,
          channel: "CHAT",
          text: `[PROSPECT WEB] Contact : ${params.contact} | ${newThread.initialQuery}`,
          is_read: false,
        },
      ])
      .then(({ error }) => {
        if (error) console.warn("Notice sync Supabase chat:", error);
      });
  }

  return newThread;
}

/**
 * Un conseiller prend en charge un fil de la file d'attente (Claim).
 */
export function claimLiveChatThread(
  threadId: string,
  advisorName: string,
  advisorRole?: string
): LiveChatThread | null {
  const threads = getLiveChatThreads();
  const targetIndex = threads.findIndex((t) => t.id === threadId);
  if (targetIndex === -1) return null;

  const target = threads[targetIndex];
  const timeStr = new Date().toLocaleTimeString("fr-FR").slice(0, 5);

  const updatedThread: LiveChatThread = {
    ...target,
    status: "ACTIVE",
    assignedAdvisor: advisorName,
    assignedAdvisorRole: advisorRole || "Desk Advisor",
    lastActivity: new Date().toISOString(),
    messages: [
      ...target.messages,
      {
        id: `sys-${Date.now()}`,
        sender: "SYSTEM",
        authorName: "Desk Router",
        text: `${advisorName} (${advisorRole || "Conseiller Desk"}) a pris en charge la conversation.`,
        timestamp: timeStr,
      },
    ],
  };

  threads[targetIndex] = updatedThread;
  saveThreadsAndNotify([...threads]);

  // Synchronisation Supabase si connecté
  if (isSupabaseConfigured) {
    supabase
      .from("chat_messages")
      .insert([
        {
          client_id: threadId,
          sender: "ADMIN",
          author_name: advisorName,
          channel: "CHAT",
          text: `Prise en charge du fil par ${advisorName}.`,
          is_read: true,
        },
      ])
      .then(({ error }) => {
        if (error) console.warn("Notice claim Supabase:", error);
      });
  }

  return updatedThread;
}

/**
 * Envoie un message dans un fil de discussion.
 */
export function sendLiveChatMessage(params: {
  threadId: string;
  sender: "VISITOR" | "ADVISOR";
  authorName: string;
  text: string;
}): LiveChatThread | null {
  const threads = getLiveChatThreads();
  const targetIndex = threads.findIndex((t) => t.id === params.threadId);
  if (targetIndex === -1) return null;

  const target = threads[targetIndex];
  const timeStr = new Date().toLocaleTimeString("fr-FR").slice(0, 5);

  const newMsg: LiveChatMessageItem = {
    id: `msg-${Date.now()}`,
    sender: params.sender,
    authorName: params.authorName,
    text: params.text.trim(),
    timestamp: timeStr,
  };

  const updatedThread: LiveChatThread = {
    ...target,
    lastActivity: new Date().toISOString(),
    messages: [...target.messages, newMsg],
  };

  threads[targetIndex] = updatedThread;
  saveThreadsAndNotify([...threads]);

  // Synchronisation Supabase si connecté
  if (isSupabaseConfigured) {
    supabase
      .from("chat_messages")
      .insert([
        {
          client_id: params.threadId,
          sender: params.sender === "VISITOR" ? "CLIENT" : "ADMIN",
          author_name: params.authorName,
          channel: "CHAT",
          text: params.text.trim(),
          is_read: params.sender === "ADVISOR",
        },
      ])
      .then(({ error }) => {
        if (error) console.warn("Notice send message Supabase:", error);
      });
  }

  return updatedThread;
}

/**
 * Clôture un fil de discussion une fois résolu.
 */
export function resolveLiveChatThread(threadId: string): LiveChatThread | null {
  const threads = getLiveChatThreads();
  const targetIndex = threads.findIndex((t) => t.id === threadId);
  if (targetIndex === -1) return null;

  const target = threads[targetIndex];
  const timeStr = new Date().toLocaleTimeString("fr-FR").slice(0, 5);

  const updatedThread: LiveChatThread = {
    ...target,
    status: "RESOLVED",
    lastActivity: new Date().toISOString(),
    messages: [
      ...target.messages,
      {
        id: `sys-${Date.now()}`,
        sender: "SYSTEM",
        authorName: "Desk Router",
        text: "La session de chat a été clôturée avec succès.",
        timestamp: timeStr,
      },
    ],
  };

  threads[targetIndex] = updatedThread;
  saveThreadsAndNotify([...threads]);
  return updatedThread;
}

/**
 * Hook d'abonnement aux événements temps réel du Live Chat (Supabase Realtime + Local).
 */
export function subscribeToLiveChatUpdates(
  callback: (threads: LiveChatThread[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<LiveChatThread[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getLiveChatThreads());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getLiveChatThreads());
    }
  };

  window.addEventListener("nexium_live_chat_update", handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  // Écoute Supabase Realtime si connecté
  let channel: any = null;
  if (isSupabaseConfigured) {
    try {
      channel = supabase
        .channel("public:chat_messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          () => {
            callback(getLiveChatThreads());
          }
        )
        .subscribe();
    } catch (realtimeErr) {
      console.warn("Notice Realtime Supabase:", realtimeErr);
    }
  }

  return () => {
    window.removeEventListener("nexium_live_chat_update", handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
    if (channel && isSupabaseConfigured) {
      supabase.removeChannel(channel);
    }
  };
}
