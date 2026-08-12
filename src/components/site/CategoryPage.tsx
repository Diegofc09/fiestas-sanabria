import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { listPublishedPosts } from "@/lib/posts.functions";
import { categoryLabel, type PostCategory, type PostSummary } from "@/lib/posts";
import { PostCard } from "@/components/site/PostCard";
import { Reveal } from "@/components/site/Reveal";
import { EmptyState } from "@/components/site/EmptyState";

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

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      <header className="border-b border-rule py-10 md:py-14">
        <p className="eyebrow text-primary">Sección</p>
        <h1 className="mt-3 text-[2.1rem] leading-[1.06] sm:text-5xl">{categoryLabel(category)}</h1>
        <p className="mt-4 max-w-xl font-[family-name:var(--font-serif)] leading-relaxed text-muted-foreground">
          {intro}
        </p>
      </header>

      {posts.length === 0 ? (
        <EmptyState
          title="Aún no hay publicaciones en esta sección"
          description="Pronto encontrarás aquí los contenidos de esta sección. Mientras tanto, echa un vistazo a la portada."
        />
      ) : (
        <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={Math.min(i, 5) * 0.05}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
