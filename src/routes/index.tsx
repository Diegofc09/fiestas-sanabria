import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listPublishedPosts } from "@/lib/posts.functions";
import { CATEGORIES, eventPhase, type PostCategory, type PostSummary } from "@/lib/posts";
import { FeedGrid } from "@/components/site/FeedCard";
import { EmptyState } from "@/components/site/EmptyState";
import { matchesQuery, useSearchQuery } from "@/lib/search-store";
import { cn } from "@/lib/utils";

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
