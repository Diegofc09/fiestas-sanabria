import { queryOptions, useQuery } from "@tanstack/react-query";

import { listPublishedPosts } from "@/lib/posts.functions";
import { isExpired, type PostCategory, type PostSummary } from "@/lib/posts";

/** Misma clave que la portada para reutilizar la caché ya cargada. */
export const activePostsQuery = queryOptions({
  queryKey: ["posts", "home"],
  queryFn: () => listPublishedPosts({ data: { limit: 60 } }) as Promise<PostSummary[]>,
  staleTime: 60_000,
});

/**
 * Categorías que tienen al menos una publicación visible.
 * Mientras no se conocen los datos devolvemos `null` para no ocultar nada de golpe.
 */
export function useActiveCategories(): Set<PostCategory> | null {
  const { data } = useQuery(activePostsQuery);
  if (!data) return null;
  const set = new Set<PostCategory>();
  for (const post of data) {
    if (isExpired(post)) continue;
    set.add(post.category);
  }
  return set;
}

/** Indica si una sección debe mostrarse (siempre visible mientras se cargan datos). */
export function hasCategoryContent(
  active: Set<PostCategory> | null,
  category: PostCategory,
): boolean {
  return active === null ? true : active.has(category);
}
