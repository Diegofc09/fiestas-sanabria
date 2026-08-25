import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, LayoutGrid, Search } from "lucide-react";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";


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
import { ProgressiveFeed } from "@/components/site/ProgressiveFeed";
import { CalendarView } from "@/components/site/CalendarView";
import { EmptyState } from "@/components/site/EmptyState";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { matchesQuery, setSearchOpen, setSearchQuery, useSearchQuery } from "@/lib/search-store";
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
import logoAsset from "@/assets/wolf-mark.png.asset.json";

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

// Búsqueda, filtros, orden, vista y nº de resultados cargados viven en la URL:
// así se pueden compartir, recargar y no se pierden al cargar más resultados.
const homeSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "all").default("all"),
  phase: fallback(z.string(), "all").default("all"),
  sort: fallback(z.string(), "upcoming").default("upcoming"),
  view: fallback(z.string(), "cards").default("cards"),
  n: fallback(z.number().int(), 0).default(0),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(homeSearchSchema),
  search: { middlewares: [stripSearchParams({ q: "", cat: "all", phase: "all", sort: "upcoming", view: "cards", n: 0 })] },
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
  const navigate = useNavigate({ from: "/" });
  const search = Route.useSearch();

  const query = search.q.slice(0, 120);
  const category = (CATEGORIES.some((c) => c.value === search.cat) ? search.cat : "all") as
    | PostCategory
    | "all";
  const phase = (["upcoming", "ongoing", "finished"].includes(search.phase)
    ? search.phase
    : "all") as PhaseFilter;
  const sort = (SORT_OPTIONS.some(([v]) => v === search.sort) ? search.sort : "upcoming") as SortMode;
  const view = (search.view === "calendar" ? "calendar" : "cards") as ViewMode;
  const visibleCount = search.n > 0 ? search.n : undefined;

  const patchSearch = useCallback(
    (patch: Record<string, string | number>) => {
      navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
    },
    [navigate],
  );

  // Mantiene la cabecera/pie sincronizados con la búsqueda que viaja en la URL.
  useEffect(() => {
    if (query) setSearchQuery(query);
    else setSearchOpen(false);
  }, [query]);

  const setCategory = (value: PostCategory | "all") => patchSearch({ cat: value, n: 0 });
  const setPhase = (value: PhaseFilter) => patchSearch({ phase: value, n: 0 });
  const setSort = (value: SortMode) => patchSearch({ sort: value, n: 0 });
  const setView = (value: ViewMode) => patchSearch({ view: value });


  // Secciones con al menos una publicación vigente (las vacías se ocultan).
  const availableCategories = useMemo(() => {
    const set = new Set<PostCategory>();
    for (const post of posts) {
      if (isExpired(post) && !savedIds.includes(post.id)) continue;
      set.add(post.category);
    }
    return set;
  }, [posts, savedIds]);

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
      {/* El buscador permanece montado siempre: al escribir no se remonta ni pierde el foco. */}
      <div
        className={cn(
          "mx-auto flex max-w-3xl flex-col items-center text-center",
          query ? "pt-8 md:pt-10" : "min-h-[62vh] justify-center py-16",
        )}
      >
        {!query && (
          <>
            <img
              src={logoAsset.url}
              alt="FiestasSanabria"
              className="h-24 w-auto animate-scale-in dark:invert sm:h-32"
            />
            <h1 className="mt-6 animate-fade-in font-[family-name:var(--font-display)] text-4xl font-bold leading-none tracking-tight sm:text-6xl">
              Fiestas<span className="text-primary">Sanabria</span>
            </h1>
            <p
              className="mt-4 max-w-md animate-fade-in text-[0.9375rem] font-light text-muted-foreground md:text-base"
              style={{ animationDelay: "80ms", animationFillMode: "both" }}
            >
              Busca fiestas, eventos y anuncios de la comarca de Sanabria.
            </p>
          </>
        )}

        <label
          className={cn(
            "flex w-full max-w-xl items-center gap-2.5 rounded-full border border-border bg-card px-5 py-3.5 transition-all duration-300 focus-within:border-primary focus-within:shadow-[0_10px_30px_-24px_var(--foreground)]",
            !query && "mt-8 animate-fade-in",
          )}
          style={!query ? { animationDelay: "140ms", animationFillMode: "both" } : undefined}
        >
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            placeholder="Buscar fiestas, eventos, publicidad, noticias, merchandising…"
            aria-label="Buscar publicaciones"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </label>

        {!query && (
          <nav aria-label="Secciones" className="mt-10 w-full max-w-3xl">
            <p className="eyebrow text-muted-foreground">Secciones</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORIES.filter(
                (c) => c.value !== "otros" && availableCategories.has(c.value),
              ).map((c, i) => (
                <li
                  key={c.value}
                  className="animate-fade-in"
                  style={{ animationDelay: `${200 + i * 60}ms`, animationFillMode: "both" }}
                >
                  <Link
                    to={c.path}
                    className="hover-lift flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-[0.9375rem] font-medium text-foreground hover:border-primary hover:text-primary md:text-base"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}


        {query && (
          <h1 className="mt-6 w-full text-left text-[1.6rem] font-bold leading-tight sm:text-3xl">
            Resultados para “{query}”
          </h1>
        )}
      </div>

      {query && (
        <>
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
                {CATEGORIES.filter((c) => availableCategories.has(c.value)).map((c) => (
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
          <ProgressiveFeed
            posts={filtered}
            resetKey={`${query}|${category}|${phase}|${sort}`}
          />
        </div>
      )}
        </>
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

