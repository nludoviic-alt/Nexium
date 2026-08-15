// Client HTTP vers le service e-mail dédié (email-service/), qui tourne séparément sur
// le VPS — ce site étant buildé en statique (voir vite.config.ts: nitro:false), il ne
// peut pas exécuter ce backend lui-même.
//
// SÉCURITÉ — IMPORTANT : ce build est statique, donc VITE_EMAIL_API_KEY est visible dans
// le bundle JS livré au navigateur (n'importe qui peut l'extraire via les devtools). Ce
// n'est PAS un secret côté client — c'est juste une barrière anti-bot/anti-scan basique
// côté service. La vraie protection vient de x-user-id vérifié contre la table des
// agents côté serveur. TODO(auth réelle) : une fois une authentification centrale en
// place, remplacer ce header par un cookie de session httpOnly signé, jamais lisible en
// JS, et supprimer VITE_EMAIL_API_KEY.
const API_URL = import.meta.env.VITE_EMAIL_API_URL ?? "";
const API_KEY = import.meta.env.VITE_EMAIL_API_KEY ?? "";

export type ConversationStatus = "NON_ASSIGNE" | "EN_COURS" | "EN_ATTENTE" | "RESOLU";
export type AgentAvailability = "DISPONIBLE" | "OCCUPE" | "PAUSE" | "HORS_LIGNE";
export type MessageDirection = "INBOUND" | "OUTBOUND";

export interface EmailConversationListItem {
  id: string;
  subject: string;
  customerName: string | null;
  customerEmail: string;
  status: ConversationStatus;
  assignedUserId: string | null;
  assignedAgentName: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  attachmentCount: number;
  unread: boolean;
}

export interface EmailMessage {
  id: string;
  conversationId: string;
  messageId: string;
  direction: MessageDirection;
  fromEmail: string;
  fromName: string | null;
  toEmail: string;
  subject: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
  sentByUserId: string | null;
  sendStatus: "PENDING" | "SENT" | "FAILED" | null;
  receivedAt: string;
}

export interface EmailNote {
  id: string;
  conversationId: string;
  userId: string;
  authorName: string | null;
  content: string;
  createdAt: string;
}

export interface EmailAttachment {
  id: string;
  messageId: string | null;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface EmailConversationDetail {
  conversation: EmailConversationListItem & { accountId: string; createdAt: string; updatedAt: string };
  messages: EmailMessage[];
  notes: EmailNote[];
  attachments: EmailAttachment[];
}

export interface EmailAgentSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  availability: AgentAvailability;
  canTransfer: boolean;
  activeConversations: number;
}

export type EmailConversationFilter = "inbox" | "mine" | "unassigned" | "in_progress" | "waiting" | "resolved";

export class EmailApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
  }
}

export function isEmailApiConfigured(): boolean {
  return Boolean(API_URL);
}

async function request<T>(path: string, currentUserId: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new EmailApiError("Le service e-mail n'est pas configuré (VITE_EMAIL_API_URL manquant).", 0, "not_configured");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "x-user-id": currentUserId,
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let code: string | undefined;
    try {
      const body = await res.json();
      code = body?.error;
    } catch {
      // pas de corps JSON, on garde juste le status
    }
    throw new EmailApiError(`Requête échouée (${res.status})`, res.status, code);
  }

  return res.json() as Promise<T>;
}

export const emailApi = {
  listConversations(userId: string, filter: EmailConversationFilter, search: string) {
    const params = new URLSearchParams({ filter, search });
    return request<{ items: EmailConversationListItem[] }>(`/api/conversations?${params}`, userId);
  },

  createConversation(userId: string, to: string, subject: string, text: string) {
    return request<{ ok: true; conversationId: string }>("/api/conversations", userId, {
      method: "POST",
      body: JSON.stringify({ to, subject, text }),
    });
  },

  getCounts(userId: string) {
    return request<{ inbox: number; mine: number; unassigned: number; inProgress: number; waiting: number; resolved: number }>(
      "/api/conversations/counts",
      userId
    );
  },

  getConversation(userId: string, conversationId: string) {
    return request<EmailConversationDetail>(`/api/conversations/${conversationId}`, userId);
  },

  claim(userId: string, conversationId: string) {
    return request<{ ok: true }>(`/api/conversations/${conversationId}/claim`, userId, { method: "POST" });
  },

  transfer(userId: string, conversationId: string, targetUserId: string) {
    return request<{ ok: true }>(`/api/conversations/${conversationId}/transfer`, userId, {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    });
  },

  setStatus(userId: string, conversationId: string, status: ConversationStatus) {
    return request<{ ok: true }>(`/api/conversations/${conversationId}/status`, userId, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  reply(userId: string, conversationId: string, text: string, attachmentIds: string[]) {
    return request<{ ok: true }>(`/api/conversations/${conversationId}/reply`, userId, {
      method: "POST",
      body: JSON.stringify({ text, attachmentIds }),
    });
  },

  addNote(userId: string, conversationId: string, content: string) {
    return request<{ ok: true; id: string }>(`/api/conversations/${conversationId}/notes`, userId, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  async uploadAttachment(userId: string, conversationId: string, file: File) {
    const form = new FormData();
    form.append("conversationId", conversationId);
    form.append("file", file);
    return request<{ id: string; filename: string; mimeType: string; size: number }>("/api/attachments", userId, {
      method: "POST",
      body: form,
    });
  },

  // Le téléchargement doit passer par fetch() (pas un <a href> brut) car il faut les
  // en-têtes d'auth — on récupère le blob et on déclenche l'enregistrement nous-mêmes.
  async downloadAttachment(userId: string, attachmentId: string, filename: string) {
    const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, {
      headers: { Authorization: `Bearer ${API_KEY}`, "x-user-id": userId },
    });
    if (!res.ok) throw new EmailApiError(`Téléchargement échoué (${res.status})`, res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  listAgents(userId: string) {
    return request<{ agents: EmailAgentSummary[] }>("/api/agents", userId);
  },

  setMyAvailability(userId: string, availability: AgentAvailability) {
    return request<{ ok: true }>("/api/agents/me/availability", userId, {
      method: "PATCH",
      body: JSON.stringify({ availability }),
    });
  },

  triggerSync(userId: string) {
    return request<{ ok: true; imported: number; skipped: number } | { error: string }>("/api/sync", userId, { method: "POST" });
  },
};
