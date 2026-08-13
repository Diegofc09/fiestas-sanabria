import { useSyncExternalStore } from "react";

let query = "";
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setSearchQuery(value: string) {
  query = value;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Consulta de búsqueda compartida entre la cabecera y el feed. */
export function useSearchQuery(): string {
  return useSyncExternalStore(
    subscribe,
    () => query,
    () => "",
  );
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Filtra publicaciones por palabras clave en título, entradilla y categoría. */
export function matchesQuery(
  post: { title: string; excerpt?: string | null; category: string },
  rawQuery: string,
): boolean {
  const q = normalize(rawQuery);
  if (!q) return true;
  const haystack = normalize(`${post.title} ${post.excerpt ?? ""} ${post.category}`);
  return q.split(/\s+/).every((token) => haystack.includes(token));
}
