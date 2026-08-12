import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { listPublishedPosts } from "@/lib/posts.functions";
import type { PostSummary } from "@/lib/posts";
import { LeadCard, PostCard, PostRow } from "@/components/site/PostCard";
import { Reveal } from "@/components/site/Reveal";
import { EmptyState } from "@/components/site/EmptyState";
import { SectionHeading } from "@/components/site/SectionHeading";

const homeQuery = queryOptions({
  queryKey: ["posts", "home"],
  queryFn: () => listPublishedPosts({ data: { limit: 40 } }) as Promise<PostSummary[]>,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: () => ({
    meta: [
      { title: "TodoSanabria — Fiestas, eventos y noticias de la comarca" },
      {
        name: "description",
        content:
          "Portada de TodoSanabria: últimas publicaciones sobre fiestas, eventos, noticias y anuncios de la comarca de Sanabria.",
      },
      { property: "og:title", content: "TodoSanabria — Fiestas, eventos y noticias de la comarca" },
      {
        property: "og:description",
        content: "Portada de TodoSanabria: últimas publicaciones sobre fiestas, eventos, noticias y anuncios de la comarca de Sanabria.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: posts } = useSuspenseQuery(homeQuery);

  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <Masthead />
        <EmptyState />
      </div>
    );
  }

  const [lead, ...rest] = posts;
  const secondary = rest.slice(0, 3);
  const feature = rest.slice(3, 5);
  const remainder = rest.slice(5);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-8 md:px-8">
      <Masthead />

      <Reveal>{lead && <LeadCard post={lead} />}</Reveal>

      {secondary.length > 0 && (
        <section className="mt-16 border-t border-rule pt-10 md:mt-20">
          <SectionHeading title="Últimas publicaciones" />
          <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {secondary.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.06}>
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {feature.length > 0 && (
        <section className="mt-16 rounded-sm bg-ink px-5 py-12 text-ink-foreground md:mt-20 md:px-10 md:py-14">
          <p className="eyebrow text-ink-foreground/50">También en Sanabria</p>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            {feature.map((post, i) => (
              <Reveal key={post.id} delay={i * 0.06}>
                <FeatureItem post={post} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {remainder.length > 0 && (
        <section className="mt-16 md:mt-20">
          <SectionHeading title="Más publicaciones" />
          <div className="mt-6">
            {remainder.map((post, i) => (
              <Reveal key={post.id} delay={Math.min(i, 4) * 0.04}>
                <PostRow post={post} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FeatureItem({ post }: { post: PostSummary }) {
  return (
    <div className="[&_.eyebrow]:text-ink-foreground/70 [&_h3]:text-ink-foreground [&_p]:text-ink-foreground/70 [&_time]:text-ink-foreground/60">
      <PostCard post={post} compact />
    </div>
  );
}

function Masthead() {
  return (
    <div className="border-b border-rule py-8 md:py-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h1 className="max-w-3xl text-[2.1rem] leading-[1.05] sm:text-5xl md:text-[3.4rem]">
          Todo lo que se celebra en Sanabria
        </h1>
        <p className="max-w-sm font-[family-name:var(--font-serif)] text-[0.9375rem] leading-relaxed text-muted-foreground">
          Fiestas patronales, verbenas, romerías, eventos culturales y anuncios de interés de la
          comarca, contados con calma.
        </p>
      </div>
    </div>
  );
}
