import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

import { trackPostView } from "@/lib/analytics.functions";

import { getPublishedPost } from "@/lib/posts.functions";
import { categoryLabel, formatDate, stripHtml, type Post, type PostSummary } from "@/lib/posts";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { PostCard } from "@/components/site/PostCard";
import { Reveal } from "@/components/site/Reveal";
import { ShareBar } from "@/components/site/ShareBar";
import { AttendanceBox } from "@/components/site/AttendanceBox";
import { CommentsSection } from "@/components/site/CommentsSection";
import { EventPhaseBadge } from "@/components/site/EventPhaseBadge";
import { supportsEvent } from "@/lib/engagement";

type ArticlePayload = { post: Post; related: PostSummary[] };

const articleQuery = (slug: string) =>
  queryOptions({
    queryKey: ["post", slug],
    queryFn: async () => {
      const result = (await getPublishedPost({ data: { slug } })) as ArticlePayload | null;
      if (!result) throw notFound();
      return result;
    },
  });

export const Route = createFileRoute("/articulo/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(articleQuery(params.slug)),
  head: ({ params, loaderData }) => {
    const data = loaderData as ArticlePayload | undefined;
    if (!data) {
      return {
        meta: [{ title: "Publicación no disponible — FiestasSanabria" }, { name: "robots", content: "noindex" }],
      };
    }
    const { post } = data;
    const description = (post.excerpt ?? stripHtml(post.content)).slice(0, 155);
    const url = `/articulo/${params.slug}`;
    return {
      meta: [
        { title: `${post.title} — FiestasSanabria` },
        { name: "description", content: description },
        { property: "og:title", content: post.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(post.cover_image_url?.startsWith("https://")
          ? [
              { property: "og:image", content: post.cover_image_url },
              { name: "twitter:image", content: post.cover_image_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: post.title,
            description,
            datePublished: post.published_at ?? post.created_at,
            dateModified: post.updated_at,
            articleSection: categoryLabel(post.category),
            publisher: { "@type": "Organization", name: "FiestasSanabria" },
          }),
        },
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(articleQuery(slug));
  const { post, related } = data;
  const date = post.published_at ?? post.created_at;

  useEffect(() => {
    void trackPostView({ data: { postId: post.id } }).catch(() => {});
  }, [post.id]);

  const isEvent = supportsEvent(post.category);

  return (
    <article className="pb-10">
      <div className="mx-auto max-w-3xl px-5 pt-8 md:px-8 md:pt-14">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[0.9375rem] text-muted-foreground transition-colors md:text-sm hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Portada
        </Link>

        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="eyebrow rounded-full bg-secondary px-3 py-1 text-primary">
            {categoryLabel(post.category)}
          </span>
          {post.event_date && (
            <>
              <span className="eyebrow rounded-full border border-border px-3 py-1 text-foreground">
                {formatDate(`${post.event_date}T12:00:00Z`)}
                {post.event_end_date && post.event_end_date !== post.event_date
                  ? ` – ${formatDate(`${post.event_end_date}T12:00:00Z`)}`
                  : ""}
              </span>
              <EventPhaseBadge post={post} className="px-3 py-1" />
            </>
          )}
        </div>


        <h1 className="mt-4 text-[2.1rem] leading-[1.06] sm:text-5xl md:text-[3.25rem]">{post.title}</h1>

        {post.excerpt && (
          <p className="mt-5 border-l-2 border-primary pl-4 font-[family-name:var(--font-serif)] text-lg leading-relaxed text-muted-foreground md:text-xl">
            {post.excerpt}
          </p>
        )}
      </div>

      {/* Bloque social primero: asistencia, valoración y comentarios */}
      <div className="mx-auto mt-8 max-w-3xl px-5 md:px-8">
        {isEvent && <AttendanceBox postId={post.id} eventDate={post.event_date} />}

        <div className={isEvent ? "mt-5" : "mt-0"}>
          <CommentsSection postId={post.id} withRating={isEvent} />
        </div>
      </div>

      {post.cover_image_url && (
        <figure className="mx-auto mt-12 max-w-5xl px-0 md:px-8">
          <div className="overflow-hidden bg-secondary md:rounded-sm">
            <img
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              className="h-full w-full object-cover"
              sizes="(max-width: 768px) 100vw, 1024px"
              decoding="async"
            />
          </div>
          {post.cover_image_alt && (
            <figcaption className="mx-auto mt-3 max-w-3xl px-5 text-[0.8125rem] text-muted-foreground md:px-0 md:text-xs">
              {post.cover_image_alt}
            </figcaption>
          )}
        </figure>
      )}

      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <div
          className="article-body mt-10 md:mt-14"
          // El HTML se sanea al guardar y también aquí antes de renderizarse.
          dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(post.content) }}
        />

        <ShareBar title={post.title} slug={post.slug} />
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl border-t border-rule px-5 pt-10 md:px-8">
          <h2 className="text-xl md:text-2xl">Más en {categoryLabel(post.category)}</h2>
          <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.06}>
                <PostCard post={item} compact />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
