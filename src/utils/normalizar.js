/**
 * toTitleCase
 * Convierte un texto a Title Case para estandarizar nombres,
 * categorías, marcas y tamaños en el catálogo.
 *
 * Ejemplos:
 *   "FRUTAS"           → "Frutas"
 *   "globo latex"      → "Globo Latex"
 *   "BRILLO PARA GLOBO"→ "Brillo Para Globo"
 *   "letras led"       → "Letras Led"
 *   "  orbz  azul  "   → "Orbz Azul"
 */
export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\p{L}+/gu, word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
}
