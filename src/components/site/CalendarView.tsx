import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

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
export const PHASE_DOT: Record<EventPhase, string> = {
  upcoming: "bg-phase-upcoming",
  ongoing: "bg-phase-ongoing",
  finished: "bg-phase-finished",
};

/** Estilo de la barra del evento según su fase (semáforo). */
const PHASE_BAR: Record<EventPhase | "none", string> = {
  upcoming: "bg-phase-upcoming/20 text-foreground ring-1 ring-inset ring-phase-upcoming/60",
  ongoing: "bg-phase-ongoing/20 text-foreground ring-1 ring-inset ring-phase-ongoing/60",
  finished: "bg-phase-finished/15 text-muted-foreground ring-1 ring-inset ring-phase-finished/50",
  none: "bg-secondary text-foreground ring-1 ring-inset ring-border",
};

const WEEKDAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
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

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayKey(value: string): string {
  return toKey(new Date(value));
}

/** Rango [inicio, fin] de una publicación en claves YYYY-MM-DD. */
function postRange(post: PostSummary): { start: string; end: string } {
  if (post.event_date) {
    return { start: post.event_date, end: post.event_end_date ?? post.event_date };
  }
  const key = dayKey(timelineDate(post));
  return { start: key, end: key };
}

type Segment = { post: PostSummary; startCol: number; span: number; lane: number };

/** Calendario mensual con barras de eventos que abarcan todos sus días. */
export function CalendarView({ posts }: { posts: PostSummary[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  /** Semanas visibles: filas de 7 días (incluye días de meses vecinos). */
  const weeks = useMemo(() => {
    const start = new Date(year, month, 1 - firstWeekday);
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    const list: Date[][] = [];
    for (let i = 0; i < totalCells; i += 7) {
      list.push(
        Array.from({ length: 7 }, (_, k) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i + k)),
      );
    }
    return list;
  }, [year, month, firstWeekday, daysInMonth]);

  /** Publicaciones por día (una fiesta aparece en todos sus días). */
  const byDay = useMemo(() => {
    const map = new Map<string, PostSummary[]>();
    for (const post of posts) {
      const { start, end } = postRange(post);
      const cursorDay = new Date(`${start}T12:00:00Z`);
      const endDay = new Date(`${end}T12:00:00Z`);
      let guard = 0;
      while (cursorDay.getTime() <= endDay.getTime() && guard < 400) {
        const key = `${cursorDay.getUTCFullYear()}-${String(cursorDay.getUTCMonth() + 1).padStart(2, "0")}-${String(cursorDay.getUTCDate()).padStart(2, "0")}`;
        const list = map.get(key);
        if (list) list.push(post);
        else map.set(key, [post]);
        cursorDay.setUTCDate(cursorDay.getUTCDate() + 1);
        guard += 1;
      }
    }
    return map;
  }, [posts]);

  /** Segmentos por semana con carriles para que no se solapen. */
  const segmentsByWeek = useMemo(() => {
    return weeks.map((week) => {
      const weekStart = toKey(week[0]!);
      const weekEnd = toKey(week[6]!);
      const inWeek = posts
        .map((post) => ({ post, ...postRange(post) }))
        .filter((p) => p.start <= weekEnd && p.end >= weekStart)
        .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : b.end.localeCompare(a.end)));

      const lanes: number[] = []; // última columna ocupada por carril
      const segments: Segment[] = [];
      for (const item of inWeek) {
        const startIndex = Math.max(0, week.findIndex((d) => toKey(d) === item.start));
        const endFound = week.findIndex((d) => toKey(d) === item.end);
        const endIndex = endFound === -1 ? 6 : endFound;
        const startCol = item.start < weekStart ? 0 : startIndex;
        const span = Math.max(1, endIndex - startCol + 1);
        let lane = lanes.findIndex((occupiedUntil) => occupiedUntil < startCol);
        if (lane === -1) {
          lane = lanes.length;
          lanes.push(startCol + span - 1);
        } else {
          lanes[lane] = startCol + span - 1;
        }
        segments.push({ post: item.post, startCol, span, lane });
      }
      return segments;
    });
  }, [weeks, posts]);

  const monthPosts = posts
    .filter((p) => {
      const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
      const { start, end } = postRange(p);
      return start <= monthEnd && end >= monthStart;
    })
    .sort((a, b) => (postRange(a).start < postRange(b).start ? -1 : 1));

  const selectedPosts = selected ? (byDay.get(selected) ?? []) : null;
  const listed = selectedPosts ?? monthPosts;

  const move = (delta: number) => {
    setSelected(null);
    setCursor(new Date(year, month + delta, 1));
  };

  const todayKey = toKey(today);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
              }}
              className="rounded-full border border-border bg-secondary px-4 py-1.5 text-[0.8125rem] font-medium md:text-sm"
            >
              Hoy
            </button>
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => move(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => move(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <h2 className="ml-1 font-[family-name:var(--font-display)] text-xl capitalize md:text-2xl">
              {MONTHS[month]} de {year}
            </h2>
          </div>
          <p className="text-[0.8125rem] text-muted-foreground md:text-xs">
            Clic en una etiqueta para ver detalles · clic en un día para filtrar
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-secondary/60">
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                className="py-2 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>

          {weeks.map((week, wi) => {
            const segments = segmentsByWeek[wi] ?? [];
            const laneCount = segments.reduce((max, s) => Math.max(max, s.lane + 1), 0);
            return (
              <div key={toKey(week[0]!)} className="border-b border-border last:border-b-0">
                <div className="grid grid-cols-7">
                  {week.map((d) => {
                    const key = toKey(d);
                    const isCurrentMonth = d.getMonth() === month;
                    const isToday = key === todayKey;
                    const isSelected = selected === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelected(isSelected ? null : key)}
                        className={cn(
                          "flex justify-center border-r border-border/60 py-2 last:border-r-0",
                          !isCurrentMonth && "text-muted-foreground/50",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm",
                            isToday && "bg-primary font-semibold text-primary-foreground",
                            !isToday && isSelected && "bg-secondary font-semibold text-primary",
                          )}
                        >
                          {d.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className="grid grid-cols-7 gap-y-1 px-1 pb-2"
                  style={{ minHeight: laneCount === 0 ? 8 : undefined }}
                >
                  {segments.map((seg) => {
                    const phase = eventPhase(seg.post) ?? "none";
                    return (
                      <Link
                        key={`${seg.post.id}-${seg.startCol}`}
                        to="/articulo/$slug"
                        params={{ slug: seg.post.slug }}
                        title={seg.post.title}
                        style={{
                          gridColumn: `${seg.startCol + 1} / span ${seg.span}`,
                          gridRow: seg.lane + 1,
                        }}
                        className={cn(
                          "mx-0.5 truncate rounded-full px-2.5 py-1 text-[0.75rem] font-medium transition-opacity hover:opacity-80 md:text-xs",
                          PHASE_BAR[phase],
                        )}
                      >
                        {seg.post.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem] text-muted-foreground md:text-xs">
          {(
            [
              ["upcoming", "Sin empezar"],
              ["ongoing", "En curso"],
              ["finished", "Terminada"],
            ] as [EventPhase, string][]
          ).map(([p, label]) => (
            <li key={p} className="inline-flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", PHASE_DOT[p])} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      <section>
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
                      <EventPhaseBadge post={post} />
                    </div>

                    <h3 className="text-lg leading-snug transition-colors group-hover:text-primary">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="line-clamp-2 text-[0.9375rem] font-light leading-relaxed text-muted-foreground md:text-sm">
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
            className="mt-4 text-[0.9375rem] font-medium text-primary underline-offset-4 hover:underline md:text-sm"
          >
            Ver todo el mes
          </button>
        )}
      </section>
    </div>
  );
}
