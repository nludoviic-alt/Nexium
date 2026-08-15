export const MIN_PASSWORD_LENGTH = 8;

/**
 * Renvoie un message d'erreur si le mot de passe ne respecte pas la
 * politique minimale, ou null s'il est valide.
 */
export function passwordIssue(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  return null;
}
