import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { listPublishedPosts } from "@/lib/posts.functions";
import { categoryLabel, type PostCategory, type PostSummary } from "@/lib/posts";
import { FeedGrid } from "@/components/site/FeedCard";
import { EmptyState } from "@/components/site/EmptyState";
import { matchesQuery, useSearchQuery } from "@/lib/search-store";

export const categoryQuery = (category: PostCategory) =>
  queryOptions({
    queryKey: ["posts", "category", category],
    queryFn: () => listPublishedPosts({ data: { category, limit: 60 } }) as Promise<PostSummary[]>,
  });

export function CategoryPage({
  category,
  intro,
}: {
  category: PostCategory;
  intro: string;
}) {
  const { data: posts } = useSuspenseQuery(categoryQuery(category));
  const query = useSearchQuery();
  const { savedIds } = useSavedPosts();
  const filtered = useMemo(
    () =>
      posts.filter(
        (p) => (!isExpired(p) || savedIds.includes(p.id)) && matchesQuery(p, query),
      ),
    [posts, query, savedIds],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 pb-14 md:px-8">
      <header className="py-9 md:py-12">
        <p className="eyebrow text-neon-cyan">Sección</p>
        <h1 className="text-glow-violet mt-3 text-[2.1rem] font-bold leading-[1.04] sm:text-5xl">
          {categoryLabel(category)}
        </h1>
        <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted-foreground md:text-[0.9375rem]">
          {intro}
        </p>
      </header>

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? "Sin resultados" : "Aún no hay publicaciones en esta sección"}
          description={
            query
              ? `No hemos encontrado nada para “${query}” en esta sección.`
              : "Pronto encontrarás aquí los contenidos de esta sección. Mientras tanto, echa un vistazo al feed principal."
          }
        />
      ) : (
        <FeedGrid posts={filtered} />
      )}
    </div>
  );
}
