import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import type { PostSummary } from "@/lib/posts";
import { FeedGrid } from "./FeedCard";

const PAGE_SIZE = 8;

/**
 * Feed con carga progresiva: muestra los primeros resultados y va añadiendo
 * tandas al acercarse al final de la lista (con botón de respaldo).
 */
export function ProgressiveFeed({
  posts,
  pageSize = PAGE_SIZE,
  resetKey,
}: {
  posts: PostSummary[];
  pageSize?: number;
  resetKey?: string;
}) {
  const [visible, setVisible] = useState(pageSize);
  const sentinel = useRef<HTMLDivElement>(null);

  // Al cambiar la búsqueda o los filtros volvemos a la primera tanda.
  useEffect(() => {
    setVisible(pageSize);
  }, [resetKey, pageSize, posts.length]);

  const shown = useMemo(() => posts.slice(0, visible), [posts, visible]);
  const hasMore = visible < posts.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + pageSize, posts.length));
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, pageSize, posts.length, visible]);

  return (
    <div>
      <FeedGrid posts={shown} />

      {hasMore && (
        <div ref={sentinel} className="mt-10 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setVisible((v) => Math.min(v + pageSize, posts.length))}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-[0.9375rem] font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary active:scale-95 md:text-sm"
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            Cargar más
          </button>
          <p className="text-[0.8125rem] font-light text-muted-foreground">
            {shown.length} de {posts.length} publicaciones
          </p>
        </div>
      )}

      {!hasMore && posts.length > pageSize && (
        <p className="mt-10 text-center text-[0.8125rem] font-light text-muted-foreground animate-fade-in">
          Has visto las {posts.length} publicaciones.
        </p>
      )}
    </div>
  );
}
