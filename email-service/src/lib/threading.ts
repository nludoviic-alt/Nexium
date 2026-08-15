import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "../db/client.js";
import { emailConversations, emailMessages } from "../db/schema.js";

// §5 : reconstruire les threads via Message-ID / In-Reply-To / References — jamais
// uniquement via l'objet de l'e-mail.
export async function findExistingConversationId(params: {
  fromEmail: string;
  inReplyTo: string | null;
  references: string[];
}): Promise<string | null> {
  const candidateIds = [params.inReplyTo, ...params.references].filter((v): v is string => Boolean(v));

  if (candidateIds.length > 0) {
    const matches = await db
      .select({ conversationId: emailMessages.conversationId })
      .from(emailMessages)
      .where(inArray(emailMessages.messageId, candidateIds))
      .limit(1);

    if (matches[0]) return matches[0].conversationId;
  }

  // Repli : pas de header exploitable (client mail qui casse le threading, ou premier
  // message d'une relance sans In-Reply-To). On rattache au thread le plus récent et non
  // résolu du même expéditeur, plutôt que d'ouvrir un doublon.
  const fallback = await db
    .select({ id: emailConversations.id })
    .from(emailConversations)
    .where(and(eq(emailConversations.customerEmail, params.fromEmail.toLowerCase()), ne(emailConversations.status, "RESOLU")))
    .orderBy(desc(emailConversations.lastMessageAt))
    .limit(1);

  return fallback[0]?.id ?? null;
}
