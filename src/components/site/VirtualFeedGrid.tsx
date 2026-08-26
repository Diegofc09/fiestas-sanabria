import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

import type { PostSummary } from "@/lib/posts";
import { FeedCard, FeedGrid } from "./FeedCard";

/** Columnas de la cuadrícula según el ancho de la ventana (igual que FeedGrid). */
function useColumnCount() {
  const [cols, setCols] = useState(1);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setCols(w >= 1280 ? 4 : w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return cols;
}

function chunk<T>(items: T[], size: number) {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/**
 * Cuadrícula virtualizada: sólo monta las filas visibles (más un margen), de
 * modo que la lista sigue siendo fluida aunque haya cientos de publicaciones.
 * Antes de hidratar (y en SSR) se renderiza la cuadrícula normal para no
 * perder contenido indexable.
 */
export function VirtualFeedGrid({ posts }: { posts: PostSummary[] }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const cols = useColumnCount();
  const rows = useMemo(() => chunk(posts, cols), [posts, cols]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    if (!hydrated) return;
    const measure = () => {
      const el = containerRef.current;
      if (el) setOffset(el.getBoundingClientRect().top + window.scrollY);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [hydrated, cols, posts.length]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 440,
    overscan: 2,
    scrollMargin: offset,
    gap: 20,
  });

  if (!hydrated) return <FeedGrid posts={posts.slice(0, cols * 3)} />;

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={containerRef}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {items.map((item) => {
          const row = rows[item.index];
          if (!row) return null;
          return (
            <div
              key={item.key}
              ref={virtualizer.measureElement}
              data-index={item.index}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {row.map((post, i) => (
                  <FeedCard key={post.id} post={post} priority={item.index === 0 && i < 4} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
