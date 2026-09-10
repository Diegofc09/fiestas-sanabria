import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import type { PostSummary } from "@/lib/posts";
import { FEED_CARD_ATTR, takeOpenedPost } from "@/lib/feed-focus";
import { FeedGrid } from "./FeedCard";
import { VirtualFeedGrid } from "./VirtualFeedGrid";

// A partir de este número de tarjetas montamos sólo las filas visibles.
const VIRTUALIZE_FROM = 24;

const PAGE_SIZE = 8;

/**
 * Feed con carga progresiva: muestra los primeros resultados y va añadiendo
 * tandas al acercarse al final de la lista (con botón de respaldo).
 *
 * Si se pasa `visible` + `onVisibleChange`, el número de resultados cargados
 * queda controlado desde fuera (por ejemplo, guardado en la URL) para que no se
 * pierda al recargar o al compartir el enlace.
 */
export function ProgressiveFeed({
  posts,
  pageSize = PAGE_SIZE,
  resetKey,
  visible: visibleProp,
  onVisibleChange,
  error,
  onRetry,
}: {
  posts: PostSummary[];
  pageSize?: number;
  resetKey?: string;
  visible?: number | undefined;
  onVisibleChange?: (visible: number) => void;
  error?: unknown;
  onRetry?: () => void;
}) {
  const controlled = onVisibleChange !== undefined;
  const [internal, setInternal] = useState(pageSize);
  const visible = Math.max(pageSize, (controlled ? visibleProp : internal) ?? pageSize);
  const sentinel = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const retryRef = useRef<HTMLButtonElement>(null);

  const failed = loadError ?? (error ? "No hemos podido cargar más publicaciones." : null);

  const setVisible = (next: number) => {
    try {
      if (controlled) onVisibleChange?.(next);
      else setInternal(next);
      setLoadError(null);
    } catch {
      setLoadError("No hemos podido cargar más publicaciones.");
    }
  };

  const retry = () => {
    setLoadError(null);
    onRetry?.();
    setVisible(Math.min(visible + pageSize, posts.length));
    retryRef.current?.focus();
  };

  // Al cambiar la búsqueda o los filtros volvemos a la primera tanda.
  useEffect(() => {
    setLoadError(null);
    if (!controlled) setInternal(pageSize);
  }, [resetKey, pageSize, controlled]);


  const shown = useMemo(() => posts.slice(0, visible), [posts, visible]);
  const hasMore = visible < posts.length;
  const [announcement, setAnnouncement] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const previousShown = useRef(shown.length);

  // Anuncio para lectores de pantalla cuando entra una tanda nueva.
  useEffect(() => {
    if (shown.length > previousShown.current) {
      const added = shown.length - previousShown.current;
      setAnnouncement(
        `${added} publicaciones más cargadas. Mostrando ${shown.length} de ${posts.length}.`,
      );
    }
    previousShown.current = shown.length;
  }, [shown.length, posts.length]);

  // Al volver de un artículo, el foco regresa a la tarjeta que se abrió.
  useEffect(() => {
    const slug = takeOpenedPost();
    if (!slug) return;
    const target = gridRef.current?.querySelector<HTMLElement>(
      `[${FEED_CARD_ATTR}="${CSS.escape(slug)}"]`,
    );
    target?.focus({ preventScroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Precarga silenciosa de las portadas de la siguiente tanda: cuando el
  // usuario carga más, las imágenes ya están en caché (clave en móvil).
  useEffect(() => {
    if (typeof window === "undefined" || !hasMore) return;
    const next = posts.slice(visible, visible + pageSize);
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 400));
    const id = idle(() => {
      for (const post of next) {
        if (!post.cover_image_url) continue;
        const img = new Image();
        img.decoding = "async";
        img.src = post.cover_image_url;
      }
    });
    return () => window.clearTimeout(id as number);
  }, [posts, visible, pageSize, hasMore]);


  useEffect(() => {
    if (!hasMore) return;
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(Math.min(visible + pageSize, posts.length));
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, pageSize, posts.length, visible]);

  return (
    <div ref={gridRef}>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      {shown.length > VIRTUALIZE_FROM ? (
        <VirtualFeedGrid posts={shown} />
      ) : (
        <FeedGrid posts={shown} />
      )}

      {hasMore && (
        <div ref={sentinel} className="mt-10 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setVisible(Math.min(visible + pageSize, posts.length))}
            aria-label={`Cargar ${Math.min(pageSize, posts.length - shown.length)} publicaciones más (${shown.length} de ${posts.length} mostradas)`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-[0.9375rem] font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 md:text-sm"
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
