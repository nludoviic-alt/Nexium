CREATE TABLE `email_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email_address` text NOT NULL,
	`display_name` text NOT NULL,
	`imap_host` text NOT NULL,
	`imap_port` integer NOT NULL,
	`smtp_host` text NOT NULL,
	`smtp_port` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`last_synced_at` text,
	`last_synced_uid` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`availability` text DEFAULT 'HORS_LIGNE' NOT NULL,
	`can_transfer` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`assigned_to_user_id` text NOT NULL,
	`assigned_by_user_id` text,
	`reason` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `email_conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `email_agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by_user_id`) REFERENCES `email_agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text,
	`uploaded_by_user_id` text,
	`conversation_id` text,
	`filename` text NOT NULL,
	`stored_filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`storage_path` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `email_messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `email_agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`conversation_id`) REFERENCES `email_conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`subject` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_name` text,
	`assigned_user_id` text,
	`status` text DEFAULT 'NON_ASSIGNE' NOT NULL,
	`last_message_at` text DEFAULT (current_timestamp) NOT NULL,
	`last_read_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `email_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_user_id`) REFERENCES `email_agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`message_id` text NOT NULL,
	`in_reply_to` text,
	`references` text,
	`direction` text NOT NULL,
	`from_email` text NOT NULL,
	`from_name` text,
	`to_email` text NOT NULL,
	`subject` text,
	`body_html` text,
	`body_text` text,
	`sent_by_user_id` text,
	`send_status` text,
	`received_at` text DEFAULT (current_timestamp) NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `email_conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sent_by_user_id`) REFERENCES `email_agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_messages_message_id_unique` ON `email_messages` (`message_id`);--> statement-breakpoint
CREATE TABLE `email_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `email_conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `email_agents`(`id`) ON UPDATE no action ON DELETE no action
);
