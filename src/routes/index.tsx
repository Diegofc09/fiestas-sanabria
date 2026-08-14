import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, LayoutGrid } from "lucide-react";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listPublishedPosts } from "@/lib/posts.functions";
import { listPostMetrics } from "@/lib/saved.functions";
import {
  CATEGORIES,
  categoryLabel,
  eventPhase,
  isExpired,
  timelineDate,
  type PostCategory,
  type PostSummary,
} from "@/lib/posts";
import { FeedGrid } from "@/components/site/FeedCard";
import { CalendarView } from "@/components/site/CalendarView";
import { EmptyState } from "@/components/site/EmptyState";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { matchesQuery, useSearchQuery } from "@/lib/search-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type PostMetric = { post_id: string; views_count: number; saves_count: number; comments_count: number };

const metricsQuery = queryOptions({
  queryKey: ["post-metrics"],
  queryFn: () => listPostMetrics() as Promise<PostMetric[]>,
  staleTime: 60_000,
});

type SortMode = "upcoming" | "recent" | "views" | "popular";
type PhaseFilter = "all" | "upcoming" | "ongoing" | "finished";
type ViewMode = "cards" | "calendar";

const SORT_OPTIONS: [SortMode, string][] = [
  ["upcoming", "Más próximas"],
  ["recent", "Más reciente"],
  ["views", "Más visitado"],
  ["popular", "Más popular"],
];

const PHASE_OPTIONS: [Exclude<PhaseFilter, "all">, string][] = [
  ["upcoming", "Sin empezar"],
  ["ongoing", "En curso"],
  ["finished", "Terminada"],
];

function categoryLabelFor(value: PostCategory | "all"): string {
  return value === "all" ? "Todo" : categoryLabel(value);
}

function sortLabelFor(sort: SortMode, phase: PhaseFilter): string {
  const base = SORT_OPTIONS.find(([v]) => v === sort)?.[1] ?? "";
  if (phase === "all") return base;
  const extra = PHASE_OPTIONS.find(([v]) => v === phase)?.[1] ?? "";
  return `${base} · ${extra}`;
}

const homeQuery = queryOptions({
  queryKey: ["posts", "home"],
  queryFn: () => listPublishedPosts({ data: { limit: 60 } }) as Promise<PostSummary[]>,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: () => ({
    meta: [
      { title: "FiestasSanabria — Próximas fiestas y eventos de Sanabria" },
      {
        name: "description",
        content:
          "Agenda de fiestas, verbenas, mercados, música y eventos de la comarca de Sanabria: qué se celebra, cuándo y dónde.",
      },
      { property: "og:title", content: "FiestasSanabria — Próximas fiestas y eventos de Sanabria" },
      {
        property: "og:description",
        content:
          "Agenda de fiestas, verbenas, mercados, música y eventos de la comarca de Sanabria: qué se celebra, cuándo y dónde.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: posts } = useSuspenseQuery(homeQuery);
  const { data: metrics } = useQuery(metricsQuery);
  const { savedIds } = useSavedPosts();
  const query = useSearchQuery();
  const [category, setCategory] = useState<PostCategory | "all">("all");
  const [phase, setPhase] = useState<PhaseFilter>("all");
  const [sort, setSort] = useState<SortMode>("upcoming");
  const [view, setView] = useState<ViewMode>("cards");

  const metricFor = useMemo(() => {
    const map = new Map<string, PostMetric>();
    for (const metric of metrics ?? []) map.set(metric.post_id, metric);
    return map;
  }, [metrics]);

  const filtered = useMemo(() => {
    const list = posts.filter((post) => {
      if (category !== "all" && post.category !== category) return false;
      if (phase !== "all" && eventPhase(post) !== phase) return false;
      // Las publicaciones caducan a los 14 días, salvo si el usuario las guardó.
      if (isExpired(post) && !savedIds.includes(post.id)) return false;
      return matchesQuery(post, query);
    });

    if (sort === "views") {
      return [...list].sort(
        (a, b) => (metricFor.get(b.id)?.views_count ?? 0) - (metricFor.get(a.id)?.views_count ?? 0),
      );
    }
    if (sort === "popular") {
      const score = (id: string) => {
        const m = metricFor.get(id);
        return (m?.saves_count ?? 0) * 2 + (m?.comments_count ?? 0);
      };
      return [...list].sort((a, b) => score(b.id) - score(a.id));
    }
    if (sort === "upcoming") {
      // Vista por defecto: lo que está más cerca en el tiempo, primero lo que aún no ha terminado.
      const rank = (p: PostSummary) => (eventPhase(p) === "finished" ? 1 : 0);
      return [...list].sort((a, b) => {
        const byRank = rank(a) - rank(b);
        if (byRank !== 0) return byRank;
        const diff =
          new Date(timelineDate(a)).getTime() - new Date(timelineDate(b)).getTime();
        return rank(a) === 1 ? -diff : diff;
      });
    }
    return list;
  }, [posts, category, phase, query, sort, metricFor, savedIds]);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
      <header className="pt-9 md:pt-14">
        <p className="eyebrow text-primary">Agenda de la comarca</p>
        <h1 className="mt-3 max-w-3xl text-[2.1rem] font-bold leading-[1.05] sm:text-5xl md:text-[3.25rem]">
          {query ? `Resultados para “${query}”` : "Próximas fiestas y eventos en Sanabria"}
        </h1>
        <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-muted-foreground md:text-[0.9375rem]">
          Fiestas patronales, verbenas, mercados, romerías y conciertos, ordenados por lo que está
          más cerca en el tiempo.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-[0.8125rem] font-medium text-foreground md:text-sm"
              >
                Categoría
                <span className="text-muted-foreground">{categoryLabelFor(category)}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuRadioGroup
                value={category}
                onValueChange={(v) => setCategory(v as PostCategory | "all")}
              >
                <DropdownMenuRadioItem value="all">Todo</DropdownMenuRadioItem>
                {CATEGORIES.map((c) => (
                  <DropdownMenuRadioItem key={c.value} value={c.value}>
                    {c.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-[0.8125rem] font-medium text-foreground md:text-sm"
              >
                Ordenar por
                <span className="text-muted-foreground">{sortLabelFor(sort, phase)}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Orden</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(v) => setSort(v as SortMode)}
              >
                {SORT_OPTIONS.map(([value, label]) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Estado del evento</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={phase}
                onValueChange={(v) => setPhase(v as PhaseFilter)}
              >
                <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                {PHASE_OPTIONS.map(([value, label]) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className="inline-flex items-center rounded-full border border-border bg-secondary p-1"
          role="group"
          aria-label="Cambiar vista"
        >
          <ViewButton active={view === "cards"} onClick={() => setView("cards")} label="Tarjetas">
            <LayoutGrid className="h-4 w-4" />
          </ViewButton>
          <ViewButton
            active={view === "calendar"}
            onClick={() => setView("calendar")}
            label="Calendario"
          >
            <CalendarDays className="h-4 w-4" />
          </ViewButton>
        </div>
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
      ) : view === "calendar" ? (
        <div className="mt-9">
          <CalendarView posts={filtered} />
        </div>
      ) : (
        <div className="mt-8">
          <FeedGrid posts={filtered} />
        </div>
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors md:text-sm",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

