import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Reprend les rôles déjà utilisés côté admin (src/routes/admin.tsx) — pas de nouveau
// référentiel de rôles, on s'aligne sur l'existant en attendant la vraie authentification.
export type AgentRole = "OWNER" | "SUPER_ADMIN" | "ADMIN" | "CONSEILLER" | "SUPPORT" | "FINANCE" | "QUANT";
export type AgentAvailability = "DISPONIBLE" | "OCCUPE" | "PAUSE" | "HORS_LIGNE";
export type ConversationStatus = "NON_ASSIGNE" | "EN_COURS" | "EN_ATTENTE" | "RESOLU";
export type MessageDirection = "INBOUND" | "OUTBOUND";
export type SendStatus = "PENDING" | "SENT" | "FAILED";
export type AssignmentReason = "AUTO_ROUTING" | "MANUAL_CLAIM" | "TRANSFER" | "MANUAL_ASSIGN";

// Miroir léger des collaborateurs (staffList côté admin) pour pouvoir assigner/router.
// TODO(auth réelle) : remplacer par une vraie table users partagée avec l'authentification
// centrale une fois celle-ci construite, au lieu de dupliquer id/name/role ici.
export const emailAgents = sqliteTable("email_agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").$type<AgentRole>().notNull(),
  availability: text("availability").$type<AgentAvailability>().notNull().default("HORS_LIGNE"),
  canTransfer: integer("can_transfer", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const emailAccounts = sqliteTable("email_accounts", {
  id: text("id").primaryKey(),
  emailAddress: text("email_address").notNull(),
  displayName: text("display_name").notNull(),
  imapHost: text("imap_host").notNull(),
  imapPort: integer("imap_port").notNull(),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  lastSyncedAt: text("last_synced_at"),
  // Dernier UID IMAP traité — permet de ne récupérer que les nouveaux messages à chaque
  // synchro plutôt que de re-scanner toute la boîte (idempotence + performance, §13).
  lastSyncedUid: integer("last_synced_uid").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const emailConversations = sqliteTable("email_conversations", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => emailAccounts.id),
  subject: text("subject").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  assignedUserId: text("assigned_user_id").references(() => emailAgents.id),
  status: text("status").$type<ConversationStatus>().notNull().default("NON_ASSIGNE"),
  lastMessageAt: text("last_message_at").notNull().default(sql`(current_timestamp)`),
  // Lu/non-lu simplifié : horodatage de la dernière consultation, boîte partagée (pas
  // par agent) — cohérent avec une seule adresse gérée collectivement par ~20 personnes.
  lastReadAt: text("last_read_at"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

export const emailMessages = sqliteTable("email_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => emailConversations.id),
  // Header Message-ID réel (ou généré pour nos envois) — unique, sert de clé d'idempotence.
  messageId: text("message_id").notNull().unique(),
  inReplyTo: text("in_reply_to"),
  // Header References stocké tel quel (liste de Message-ID séparés par des espaces).
  references: text("references"),
  direction: text("direction").$type<MessageDirection>().notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  toEmail: text("to_email").notNull(),
  subject: text("subject"),
  bodyHtml: text("body_html"),
  bodyText: text("body_text"),
  sentByUserId: text("sent_by_user_id").references(() => emailAgents.id),
  sendStatus: text("send_status").$type<SendStatus>(),
  receivedAt: text("received_at").notNull().default(sql`(current_timestamp)`),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const emailNotes = sqliteTable("email_notes", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => emailConversations.id),
  userId: text("user_id").notNull().references(() => emailAgents.id),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const emailAttachments = sqliteTable("email_attachments", {
  id: text("id").primaryKey(),
  // Nullable : pour une pièce jointe ajoutée à une réponse en cours de rédaction, elle
  // est uploadée (et stockée sur disque) AVANT que le message sortant n'existe ; on la
  // relie au message une fois l'e-mail effectivement envoyé (voir lib/smtp.ts).
  messageId: text("message_id").references(() => emailMessages.id),
  uploadedByUserId: text("uploaded_by_user_id").references(() => emailAgents.id),
  conversationId: text("conversation_id").references(() => emailConversations.id),
  filename: text("filename").notNull(),
  storedFilename: text("stored_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// Historique des (ré)assignations — distinct de conversations.assignedUserId qui ne
// reflète que l'état courant.
export const emailAssignments = sqliteTable("email_assignments", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => emailConversations.id),
  assignedToUserId: text("assigned_to_user_id").notNull().references(() => emailAgents.id),
  assignedByUserId: text("assigned_by_user_id").references(() => emailAgents.id),
  reason: text("reason").$type<AssignmentReason>().notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});
