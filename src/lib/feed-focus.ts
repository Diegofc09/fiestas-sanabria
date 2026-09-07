/**
 * Recuerda qué tarjeta abrió el visitante para devolverle el foco al volver
 * al listado (navegación con teclado y lectores de pantalla).
 */
const KEY = "fs-last-opened-post";

export function rememberOpenedPost(slug: string) {
  try {
    window.sessionStorage.setItem(KEY, slug);
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Devuelve (y consume) el slug guardado. */
export function takeOpenedPost(): string | null {
  try {
    const slug = window.sessionStorage.getItem(KEY);
    if (slug) window.sessionStorage.removeItem(KEY);
    return slug;
  } catch {
    return null;
  }
}

export const FEED_CARD_ATTR = "data-post-slug";
