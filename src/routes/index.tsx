import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listPublishedPosts } from "@/lib/posts.functions";
import { listPostMetrics } from "@/lib/saved.functions";
import { CATEGORIES, eventPhase, isExpired, type PostCategory, type PostSummary } from "@/lib/posts";
import { FeedGrid } from "@/components/site/FeedCard";
import { EmptyState } from "@/components/site/EmptyState";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { matchesQuery, setSearchOpen, setSearchQuery, useSearchOpen, useSearchQuery } from "@/lib/search-store";
import { cn } from "@/lib/utils";

type PostMetric = { post_id: string; views_count: number; saves_count: number; comments_count: number };

const metricsQuery = queryOptions({
  queryKey: ["post-metrics"],
  queryFn: () => listPostMetrics() as Promise<PostMetric[]>,
  staleTime: 60_000,
});

type SortMode = "recent" | "views" | "popular";

const homeQuery = queryOptions({
  queryKey: ["posts", "home"],
  queryFn: () => listPublishedPosts({ data: { limit: 60 } }) as Promise<PostSummary[]>,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: () => ({
    meta: [
      { title: "FiestasSanabria — Descubre fiestas y eventos de Sanabria" },
      {
        name: "description",
        content:
          "Feed visual de fiestas, mercados, música y eventos de la comarca de Sanabria: descubre qué se celebra, cuándo y dónde.",
      },
      { property: "og:title", content: "FiestasSanabria — Descubre fiestas y eventos de Sanabria" },
      {
        property: "og:description",
        content:
          "Feed visual de fiestas, mercados, música y eventos de la comarca de Sanabria: descubre qué se celebra, cuándo y dónde.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

type PhaseFilter = "all" | "upcoming" | "ongoing" | "finished";

function HomePage() {
  const { data: posts } = useSuspenseQuery(homeQuery);
  const query = useSearchQuery();
  const searchOpen = useSearchOpen();
  const [category, setCategory] = useState<PostCategory | "all">("all");
  const [phase, setPhase] = useState<PhaseFilter>("all");

  const filtered = useMemo(
    () =>
      posts.filter((post) => {
        if (category !== "all" && post.category !== category) return false;
        if (phase !== "all" && eventPhase(post) !== phase) return false;
        return matchesQuery(post, query);
      }),
    [posts, category, phase, query],
  );

  if (!searchOpen) {
    return <SearchLanding posts={posts} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-14 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-8 md:pt-10">
        <p className="eyebrow text-neon-cyan">
          {query ? `Resultados para “${query}”` : "Explorando todas las publicaciones"}
        </p>
        <button
          type="button"
          onClick={() => setSearchOpen(false)}
          className="glow-hover rounded-full border border-border/70 bg-secondary/40 px-4 py-2 text-[0.8125rem] font-medium text-muted-foreground md:text-sm"
        >
          Cerrar búsqueda
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          Todo
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
            {c.label}
          </Chip>
        ))}
        <span className="mx-1 hidden h-8 w-px self-center bg-rule/60 sm:block" aria-hidden="true" />
        {(
          [
            ["upcoming", "Sin empezar"],
            ["ongoing", "En curso"],
            ["finished", "Terminada"],
          ] as const
        ).map(([value, label]) => (
          <Chip
            key={value}
            active={phase === value}
            tone={value}
            onClick={() => setPhase((p) => (p === value ? "all" : value))}
          >
            {label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? "Sin resultados" : "Todavía no hay publicaciones"}
          description={
            query
              ? `No hemos encontrado nada para “${query}”. Prueba con otras palabras clave.`
              : "Estamos preparando las primeras fiestas y eventos de Sanabria. Vuelve pronto."
          }
        />
      ) : (
        <div className="mt-7">
          <FeedGrid posts={filtered} />
        </div>
      )}
    </div>
  );
}

/** Portada: página limpia con el buscador centrado; el feed aparece al buscar. */
function SearchLanding({ posts }: { posts: PostSummary[] }) {
  const [value, setValue] = useState("");
  const upcoming = posts.filter((p) => eventPhase(p) === "upcoming").length;
  const ongoing = posts.filter((p) => eventPhase(p) === "ongoing").length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(true);
    setSearchQuery(value);
  };

  return (
    <section className="mx-auto flex min-h-[calc(100svh-8.5rem)] max-w-3xl flex-col items-center justify-center px-5 pb-16 text-center md:px-8">
      <p className="eyebrow text-neon-cyan">Descubre la comarca de noche y de día</p>
      <h1 className="text-glow-violet mt-3 text-[2.2rem] font-bold leading-[1.03] sm:text-5xl md:text-[3.4rem]">
        Todo lo que se celebra en Sanabria
      </h1>
      <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted-foreground md:text-[0.9375rem]">
        Fiestas patronales, verbenas, mercados, romerías y conciertos. Abre el buscador para ver
        todas las publicaciones.
      </p>

      <form onSubmit={submit} className="mt-8 w-full max-w-xl">
        <label className="neon-border glow-hover flex items-center gap-3 rounded-full bg-background/60 px-5 py-3.5 backdrop-blur-md">
          <Search className="h-5 w-5 shrink-0 text-neon-cyan" aria-hidden="true" />
          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Buscar fiestas, mercados, música... por palabras clave"
            aria-label="Buscar publicaciones"
            className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </label>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="submit"
            className="glow-hover rounded-full border border-neon-violet/70 bg-neon-violet/15 px-5 py-2.5 text-sm font-semibold text-foreground shadow-[var(--glow-violet)]"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="glow-hover rounded-full border border-border/70 bg-secondary/40 px-5 py-2.5 text-sm font-medium text-muted-foreground"
          >
            Ver todas las publicaciones
          </button>
        </div>
      </form>

      <dl className="mt-10 grid w-full max-w-xl grid-cols-3 gap-3">
        {(
          [
            [posts.length, "Publicaciones"],
            [upcoming, "Sin empezar"],
            [ongoing, "En curso"],
          ] as const
        ).map(([count, label]) => (
          <div key={label} className="glass-card rounded-2xl px-3 py-4">
            <dt className="text-2xl font-bold text-neon-cyan md:text-3xl">{count}</dt>
            <dd className="mt-1 text-[0.8125rem] text-muted-foreground">{label}</dd>
          </div>
        ))}
      </dl>

      <nav className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            to={c.path}
            className="glow-hover rounded-full border border-border/70 bg-secondary/40 px-4 py-2 text-[0.8125rem] font-medium text-muted-foreground md:text-sm"
          >
            {c.label}
          </Link>
        ))}
        <Link
          to="/calendario"
          className="glow-hover rounded-full border border-neon-cyan/60 bg-neon-cyan/10 px-4 py-2 text-[0.8125rem] font-medium text-neon-cyan md:text-sm"
        >
          Calendario
        </Link>
      </nav>
    </section>
  );
}




function Chip({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone?: "upcoming" | "ongoing" | "finished";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "glow-hover rounded-full border px-4 py-2 text-[0.8125rem] font-medium md:text-sm",
        active
          ? "border-neon-violet/70 bg-neon-violet/15 text-foreground shadow-[var(--glow-violet)]"
          : "border-border/70 bg-secondary/40 text-muted-foreground",
        active && tone === "upcoming" && "border-phase-upcoming/70 bg-phase-upcoming/15 text-phase-upcoming",
        active && tone === "ongoing" && "border-phase-ongoing/70 bg-phase-ongoing/15 text-phase-ongoing",
        active && tone === "finished" && "border-phase-finished/70 bg-phase-finished/15 text-phase-finished",
      )}
    >
      {children}
    </button>
  );
}

function Masthead() {
  return (
    <div className="pt-8 md:pt-12">
      <p className="eyebrow text-neon-cyan">Descubre la comarca de noche y de día</p>
      <h1 className="text-glow-violet mt-3 max-w-3xl text-[2.2rem] font-bold leading-[1.02] sm:text-5xl md:text-[3.5rem]">
        Todo lo que se celebra en Sanabria
      </h1>
      <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted-foreground md:text-[0.9375rem]">
        Fiestas patronales, verbenas, mercados, romerías, conciertos y eventos culturales de la
        comarca, en un solo feed.
      </p>
    </div>
  );
}
