/**
 * Helper de génération et de résolution de Slug Utilisateur personnalisé
 * pour les URLs d'espace client (ex: /portal/ludovic-martin)
 * et de Desk d'administration (ex: /desk/ludovic ou /admin/ludovic).
 */

export function slugify(text?: string | null): string {
  if (!text) return "trader";
  return text
    .toString()
    .normalize("NFD") // Sépare les accents des lettres
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Supprime les caractères non alphanumériques
    .replace(/\s+/g, "-") // Remplace les espaces par des tirets
    .replace(/-+/g, "-"); // Supprime les tirets consécutifs
}

/**
 * Génère le slug d'URL pour un client / trader (Prénom + Nom).
 * Exemples :
 * - "Ludovic Martin" -> "ludovic-martin"
 * - "investisseur@nexium.io" -> "investisseur"
 */
export function getUserSlug(user?: { name?: string | null | undefined; email?: string | null | undefined; id?: string | null | undefined }): string {
  if (!user) return "trader";

  if (user.name && user.name.trim().length > 1) {
    const cleanName = slugify(user.name);
    if (cleanName && cleanName !== "trader") return cleanName;
  }

  if (user.email) {
    const emailPrefix = user.email.split("@")[0] || "";
    const cleanEmail = slugify(emailPrefix);
    if (cleanEmail) return cleanEmail;
  }

  if (user.id) {
    return `trader-${user.id.slice(0, 6)}`;
  }

  return "trader";
}

/**
 * Génère le slug d'URL pour un Administrateur / Conseiller (JUSTE LE PRÉNOM).
 * Exemples :
 * - "Ludovic Martin" -> "ludovic"
 * - "Antoine R." -> "antoine"
 * - "admin@nexiummarkets.com" -> "admin"
 */
export function getAdminSlug(user?: { name?: string | null | undefined; email?: string | null | undefined; id?: string | null | undefined }): string {
  if (!user) return "admin";

  if (user.name && user.name.trim().length > 1) {
    const firstName = user.name.trim().split(/\s+/)[0] || "";
    const cleanFirstName = slugify(firstName);
    if (cleanFirstName && cleanFirstName !== "trader") {
      return cleanFirstName;
    }
  }

  if (user.email) {
    const emailPrefix = user.email.split("@")[0]?.split(".")[0] || "";
    const cleanEmail = slugify(emailPrefix);
    if (cleanEmail) return cleanEmail;
  }

  return "admin";
}
