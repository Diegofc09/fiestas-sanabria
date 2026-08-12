import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { listPublishedPosts } from "@/lib/posts.functions";
import {
  categoryLabel,
  eventPhase,
  formatDate,
  timelineDate,
  type EventPhase,
  type PostSummary,
} from "@/lib/posts";
import { Reveal } from "@/components/site/Reveal";
import { EmptyState } from "@/components/site/EmptyState";
import { EventPhaseBadge } from "@/components/site/EventPhaseBadge";
import { cn } from "@/lib/utils";

/** Color del semáforo para el punto del día. */
const PHASE_DOT: Record<EventPhase, string> = {
  upcoming: "bg-phase-upcoming",
  ongoing: "bg-phase-ongoing",
  finished: "bg-phase-finished",
};

/** Fase dominante de un día: en curso > sin empezar > terminada. */
function dayPhase(posts: PostSummary[]): EventPhase | null {
  const phases = posts.map((p) => eventPhase(p)).filter(Boolean) as EventPhase[];
  if (phases.includes("ongoing")) return "ongoing";
  if (phases.includes("upcoming")) return "upcoming";
  if (phases.includes("finished")) return "finished";
  return null;
}


const calendarQuery = queryOptions({
  queryKey: ["posts", "calendar"],
  queryFn: () => listPublishedPosts({ data: { limit: 60 } }) as Promise<PostSummary[]>,
});

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function dayKey(value: string): string {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const Route = createFileRoute("/calendario")({
  loader: ({ context }) => context.queryClient.ensureQueryData(calendarQuery),
  head: () => ({
    meta: [
      { title: "Calendario de fiestas y eventos — FiestasSanabria" },
      {
        name: "description",
        content:
          "Consulta mes a mes las fiestas, eventos y publicaciones de la comarca de Sanabria en el calendario de FiestasSanabria.",
      },
      { property: "og:title", content: "Calendario de fiestas y eventos en Sanabria" },
      {
        property: "og:description",
        content: "Fiestas, eventos y noticias de Sanabria organizados por fecha en un calendario mensual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/calendario" },
    ],
    links: [{ rel: "canonical", href: "/calendario" }],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { data: posts } = useSuspenseQuery(calendarQuery);
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, PostSummary[]>();
    for (const post of posts) {
      const key = dayKey(timelineDate(post));
      const list = map.get(key);
      if (list) list.push(post);
      else map.set(key, [post]);
    }
    return map;
  }, [posts]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthPosts = posts
    .filter((p) => {
      const d = new Date(timelineDate(p));
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort(
      (a, b) =>
        new Date(timelineDate(a)).getTime() -
        new Date(timelineDate(b)).getTime(),
    );

  const selectedPosts = selected ? (byDay.get(selected) ?? []) : null;
  const listed = selectedPosts ?? monthPosts;

  const move = (delta: number) => {
    setSelected(null);
    setCursor(new Date(year, month + delta, 1));
  };

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      <header className="border-b border-rule py-10 md:py-14">
        <p className="eyebrow text-primary">Agenda</p>
        <h1 className="mt-3 text-[2.1rem] leading-[1.06] sm:text-5xl">Calendario</h1>
        <p className="mt-4 max-w-xl font-[family-name:var(--font-serif)] leading-relaxed text-muted-foreground">
          Todas las fiestas, eventos y publicaciones de Sanabria organizadas por fecha. Pulsa un día para ver lo que
          hay.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
        <section className="lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl capitalize md:text-3xl">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => move(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rule text-foreground transition-colors hover:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => move(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rule text-foreground transition-colors hover:bg-secondary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <span key={d} className="eyebrow pb-2 text-muted-foreground">
                {d}
              </span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`empty-${i}`} className="aspect-square" />;
              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const count = byDay.get(key)?.length ?? 0;
              const isToday = key === dayKey(today.toISOString());
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={count === 0}
                  onClick={() => setSelected(isSelected ? null : key)}
                  aria-label={`${day} de ${MONTHS[month]}${count ? `, ${count} publicaciones` : ", sin publicaciones"}`}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-sm border text-base transition-colors md:text-sm",
                    count > 0
                      ? "border-rule bg-paper text-foreground hover:bg-secondary"
                      : "border-transparent text-muted-foreground/60",
                    isToday && "font-semibold",
                    isSelected && "border-primary bg-secondary text-primary",
                  )}
                >
                  {day}
                  {count > 0 && (
                    <span className="mt-1 flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: Math.min(count, 3) }, (_, k) => (
                        <span key={k} className="h-1 w-1 rounded-full bg-primary" />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5">
          <h2 className="border-b border-rule pb-3 font-[family-name:var(--font-display)] text-xl">
            {selected ? formatDate(`${selected}T12:00:00Z`) : `Publicaciones de ${MONTHS[month]}`}
          </h2>
          {listed.length === 0 ? (
            <EmptyState
              title="Sin publicaciones en estas fechas"
              description="Prueba con otro mes o consulta las secciones de fiestas y eventos."
            />
          ) : (
            <ul className="mt-2">
              {listed.map((post, i) => (
                <li key={post.id} className="border-b border-border">
                  <Reveal delay={Math.min(i, 5) * 0.04}>
                    <Link
                      to="/articulo/$slug"
                      params={{ slug: post.slug }}
                      className="group flex flex-col gap-1 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="eyebrow text-primary">{categoryLabel(post.category)}</span>
                        <span className="h-3 w-px bg-rule" aria-hidden="true" />
                        <time
                          dateTime={timelineDate(post)}
                          className="text-[0.8125rem] text-muted-foreground md:text-xs"
                        >
                          {formatDate(timelineDate(post))}
                        </time>
                      </div>
                      <h3 className="text-lg leading-snug">
                        <span className="bg-gradient-to-r from-primary to-primary bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                          {post.title}
                        </span>
                      </h3>
                      {post.excerpt && (
                        <p className="line-clamp-2 font-[family-name:var(--font-serif)] text-[0.9375rem] leading-relaxed text-muted-foreground md:text-sm">
                          {post.excerpt}
                        </p>
                      )}
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-4 text-[0.9375rem] font-medium text-primary md:text-sm underline-offset-4 hover:underline"
            >
              Ver todo el mes
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
