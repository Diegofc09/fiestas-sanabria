import { Link } from "@tanstack/react-router";
import { Bookmark, Heart, MessageCircle, Send, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { categoryLabel, formatDateShort, timelineDate, type PostSummary } from "@/lib/posts";
import { formatRating } from "@/lib/engagement";
import { cn } from "@/lib/utils";
import { useEngagement } from "./CommentTeaser";
import { EventPhaseBadge } from "./EventPhaseBadge";
import { Reveal } from "./Reveal";

/* ── Preferencias locales del visitante (me gusta / guardado) ───────────── */

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function useLocalFlag(key: string, id: string) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(readSet(key).has(id));
  }, [key, id]);

  const toggle = useCallback(() => {
    const set = readSet(key);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    window.localStorage.setItem(key, JSON.stringify([...set]));
    setActive(set.has(id));
  }, [key, id]);

  return [active, toggle] as const;
}

/* ── Tarjeta de feed tipo Instagram ─────────────────────────────────────── */

function Cover({ post, priority }: { post: PostSummary; priority?: boolean }) {
  if (!post.cover_image_url) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--neon-violet)_45%,transparent),transparent_65%)] bg-secondary"
        aria-hidden="true"
      >
        <span className="text-glow font-[family-name:var(--font-display)] text-3xl font-bold text-neon-cyan/80">
          FS
        </span>
      </div>
    );
  }
  return (
    <img
      src={post.cover_image_url}
      alt={post.cover_image_alt ?? post.title}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="h-full w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-editorial)] group-hover:scale-[1.07]"
    />
  );
}

export function FeedCard({
  post,
  priority,
  aspect = "aspect-[4/5]",
}: {
  post: PostSummary;
  priority?: boolean;
  aspect?: string;
}) {
  const { forPost } = useEngagement();
  const { stats } = forPost(post.id);
  const [liked, toggleLike] = useLocalFlag("fs-likes", post.id);
  const [saved, toggleSave] = useLocalFlag("fs-saved", post.id);

  const share = async () => {
    const url = `${window.location.origin}/articulo/${post.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* cancelado por el usuario */
    }
  };

  return (
    <article className="group glass-card glow-hover overflow-hidden rounded-2xl shadow-neon">
      <Link to="/articulo/$slug" params={{ slug: post.slug }} className="block">
        <div className={cn("relative overflow-hidden", aspect)}>
          <Cover post={post} priority={priority} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent opacity-90" />
          <div
            className="absolute inset-0 mix-blend-soft-light"
            style={{
              background:
                "linear-gradient(140deg, color-mix(in oklab, var(--neon-violet) 45%, transparent), transparent 55%, color-mix(in oklab, var(--neon-cyan) 35%, transparent))",
            }}
            aria-hidden="true"
          />

          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
            <span className="eyebrow rounded-full border border-neon-violet/60 bg-ink/70 px-2.5 py-1 text-neon-violet backdrop-blur-md">
              {categoryLabel(post.category)}
            </span>
            <EventPhaseBadge post={post} className="bg-ink/70 backdrop-blur-md" />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-glow line-clamp-2 font-[family-name:var(--font-display)] text-lg font-bold leading-tight text-foreground md:text-xl">
              {post.title}
            </h3>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] font-light text-neon-cyan/90 md:text-xs">
              <time dateTime={timelineDate(post)}>{formatDateShort(timelineDate(post))}</time>
              <span className="h-3 w-px bg-neon-cyan/40" aria-hidden="true" />
              <span>Sanabria · {categoryLabel(post.category)}</span>
            </p>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-1">
          <IconButton
            label={liked ? "Quitar me gusta" : "Me gusta"}
            onClick={toggleLike}
            active={liked}
            tone="pink"
          >
            <Heart className={cn("h-[18px] w-[18px]", liked && "fill-current")} />
          </IconButton>
          <IconButton label="Compartir" onClick={share} tone="cyan">
            <Send className="h-[18px] w-[18px]" />
          </IconButton>
          <IconButton
            label={saved ? "Quitar de guardados" : "Guardar"}
            onClick={toggleSave}
            active={saved}
            tone="violet"
          >
            <Bookmark className={cn("h-[18px] w-[18px]", saved && "fill-current")} />
          </IconButton>
        </div>

        <div className="flex items-center gap-3 text-[0.8125rem] font-light text-muted-foreground md:text-xs">
          {stats?.rating_avg != null && stats.rating_count > 0 && (
            <span className="text-neon-pink">★ {formatRating(stats.rating_avg)}</span>
          )}
          {(stats?.comments_count ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {stats?.comments_count}
            </span>
          )}
          {(stats?.attendance_count ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {stats?.attendance_count}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function IconButton({
  label,
  onClick,
  active,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  tone: "pink" | "cyan" | "violet";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 active:scale-90",
        tone === "pink" && "hover:text-neon-pink hover:drop-shadow-[0_0_10px_var(--neon-pink)]",
        tone === "cyan" && "hover:text-neon-cyan hover:drop-shadow-[0_0_10px_var(--neon-cyan)]",
        tone === "violet" && "hover:text-neon-violet hover:drop-shadow-[0_0_10px_var(--neon-violet)]",
        active
          ? tone === "pink"
            ? "text-neon-pink drop-shadow-[0_0_10px_var(--neon-pink)]"
            : tone === "violet"
              ? "text-neon-violet drop-shadow-[0_0_10px_var(--neon-violet)]"
              : "text-neon-cyan"
          : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Cuadrícula de feed responsive con alturas variables (masonry suave). */
export function FeedGrid({ posts }: { posts: PostSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {posts.map((post, i) => (
        <Reveal key={post.id} delay={Math.min(i, 6) * 0.05}>
          <FeedCard
            post={post}
            priority={i < 4}
            aspect={i % 7 === 0 ? "aspect-[4/5]" : i % 5 === 0 ? "aspect-square" : "aspect-[4/5]"}
          />
        </Reveal>
      ))}
    </div>
  );
}
