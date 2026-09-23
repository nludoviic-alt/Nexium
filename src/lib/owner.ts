/**
 * Compte propriétaire qui atterrit sur l'espace client à la connexion (au lieu
 * de la console admin) et dispose d'un raccourci vers l'admin depuis le
 * dashboard. Ne donne aucun droit : l'accès admin reste contrôlé par le rôle
 * Supabase du profil.
 */
export const OWNER_EMAIL = "nludoviic@gmail.com";

export function isOwnerEmail(email?: string | null): boolean {
  return email?.trim().toLowerCase() === OWNER_EMAIL;
}
