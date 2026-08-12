import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { categoryLabel, formatDate, type PostSummary } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { CommentTeaser } from "./CommentTeaser";


function Cover({
  post,
  className,
  sizes,
  priority,
}: {
  post: PostSummary;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!post.cover_image_url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-secondary text-muted-foreground",
          className,
        )}
        aria-hidden="true"
      >
        <span className="font-[family-name:var(--font-display)] text-2xl opacity-50">FS</span>
      </div>
    );
  }
  return (
    <img
      src={post.cover_image_url}
      alt={post.cover_image_alt ?? post.title}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn(
        "h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.04]",
        className,
      )}
    />
  );
}

function Meta({ post, className }: { post: PostSummary; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      <span className="eyebrow text-primary">{categoryLabel(post.category)}</span>
      <span className="h-3 w-px bg-rule" aria-hidden="true" />
      <time dateTime={post.published_at ?? post.created_at} className="text-[0.8125rem] text-muted-foreground md:text-xs">
        {formatDate(post.published_at ?? post.created_at)}
      </time>
    </div>
  );
}

/** Portada principal: pieza grande de apertura. */
export function LeadCard({ post }: { post: PostSummary }) {
  return (
    <article className="group relative">
      <Link
        to="/articulo/$slug"
        params={{ slug: post.slug }}
        className="grid gap-6 md:grid-cols-12 md:gap-10"
      >
        <div className="overflow-hidden rounded-sm bg-secondary md:col-span-7 md:order-2">
          <div className="aspect-[16/10] md:aspect-[4/3]">
            <Cover post={post} priority sizes="(max-width: 768px) 100vw, 58vw" />
          </div>
        </div>
        <div className="flex flex-col justify-center md:col-span-5 md:order-1">
          <Meta post={post} />
          <h2 className="mt-3 text-3xl leading-[1.08] sm:text-4xl md:text-[2.75rem]">
            <span className="bg-gradient-to-r from-primary to-primary bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
              {post.title}
            </span>
          </h2>
          {post.excerpt && (
            <p className="mt-4 max-w-prose font-[family-name:var(--font-serif)] text-[1.0625rem] leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          )}
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
            Leer el artículo
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
        </div>
      </Link>
    </article>
  );
}

/** Tarjeta estándar con imagen superior. */
export function PostCard({ post, compact = false }: { post: PostSummary; compact?: boolean }) {
  return (
    <article className="group">
      <Link to="/articulo/$slug" params={{ slug: post.slug }} className="block">
        <div className="overflow-hidden rounded-sm bg-secondary">
          <div className={compact ? "aspect-[16/10]" : "aspect-[3/2]"}>
            <Cover post={post} sizes="(max-width: 768px) 100vw, 33vw" />
          </div>
        </div>
        <Meta post={post} className="mt-4" />
        <h3
          className={cn(
            "mt-2 leading-tight",
            compact ? "text-lg md:text-xl" : "text-xl md:text-2xl",
          )}
        >
          <span className="bg-gradient-to-r from-primary to-primary bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
            {post.title}
          </span>
        </h3>
        {post.excerpt && !compact && (
          <p className="mt-2 line-clamp-3 font-[family-name:var(--font-serif)] text-base md:text-[0.9375rem] leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}
      </Link>
    </article>
  );
}

/** Fila de titular sin imagen destacada, para listados largos. */
export function PostRow({ post, index }: { post: PostSummary; index: number }) {
  return (
    <article className="group border-t border-rule">
      <Link
        to="/articulo/$slug"
        params={{ slug: post.slug }}
        className="flex items-start gap-4 py-5 md:gap-8"
      >
        <span className="mt-1 hidden font-[family-name:var(--font-display)] text-sm text-muted-foreground sm:block">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <Meta post={post} />
          <h3 className="mt-1.5 text-lg leading-snug md:text-2xl">
            <span className="bg-gradient-to-r from-primary to-primary bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
              {post.title}
            </span>
          </h3>
          {post.excerpt && (
            <p className="mt-1.5 line-clamp-2 font-[family-name:var(--font-serif)] text-[0.9375rem] leading-relaxed text-muted-foreground md:text-[0.9375rem]">
              {post.excerpt}
            </p>
          )}
        </div>
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-sm bg-secondary sm:h-24 sm:w-36">
          <Cover post={post} sizes="160px" />
        </div>
      </Link>
    </article>
  );
}
