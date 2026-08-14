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

/** Fase dominante de un día: en curso > sin empezar > terminada. */
function dayPhase(posts: PostSummary[]): EventPhase | null {
  const phases = posts.map((p) => eventPhase(p)).filter(Boolean) as EventPhase[];
  if (phases.includes("ongoing")) return "ongoing";
  if (phases.includes("upcoming")) return "upcoming";
  if (phases.includes("finished")) return "finished";
  return null;
}

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

/** Calendario mensual con semáforo de estado y listado del día seleccionado. */
export function CalendarView({ posts }: { posts: PostSummary[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, PostSummary[]>();
    const add = (key: string, post: PostSummary) => {
      const list = map.get(key);
      if (list) list.push(post);
      else map.set(key, [post]);
    };
    for (const post of posts) {
      // Fiestas con rango de fechas se muestran en todos los días de inicio a fin.
      if (post.event_date && post.event_end_date && post.event_end_date > post.event_date) {
        const cursorDay = new Date(`${post.event_date}T12:00:00Z`);
        const endDay = new Date(`${post.event_end_date}T12:00:00Z`);
        let guard = 0;
        while (cursorDay.getTime() <= endDay.getTime() && guard < 400) {
          add(dayKey(cursorDay.toISOString()), post);
          cursorDay.setDate(cursorDay.getDate() + 1);
          guard += 1;
        }
        continue;
      }
      add(dayKey(timelineDate(post)), post);
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
      if (p.event_date) {
        const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
        const end = p.event_end_date ?? p.event_date;
        return p.event_date <= monthEnd && end >= monthStart;
      }
      const d = new Date(timelineDate(p));
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort(
      (a, b) => new Date(timelineDate(a)).getTime() - new Date(timelineDate(b)).getTime(),
    );

  const selectedPosts = selected ? (byDay.get(selected) ?? []) : null;
  const listed = selectedPosts ?? monthPosts;

  const move = (delta: number) => {
    setSelected(null);
    setCursor(new Date(year, month + delta, 1));
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
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
              className="glow-hover inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => move(1)}
              className="glow-hover inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground"
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
            const dayPosts = byDay.get(key) ?? [];
            const count = dayPosts.length;
            const phase = dayPhase(dayPosts);
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
                  "relative flex aspect-square flex-col items-center justify-center rounded-lg border text-base transition-colors md:text-sm",
                  count > 0
                    ? "border-border bg-card text-foreground hover:bg-secondary"
                    : "border-transparent text-muted-foreground/60",
                  isToday && "font-semibold",
                  phase === "upcoming" && "border-phase-upcoming/60",
                  phase === "ongoing" && "border-phase-ongoing/70",
                  phase === "finished" && "border-phase-finished/50",
                  isSelected && "border-primary bg-secondary text-primary",
                )}
              >
                {day}
                {count > 0 && (
                  <span className="mt-1 flex gap-0.5" aria-hidden="true">
                    {Array.from({ length: Math.min(count, 3) }, (_, k) => (
                      <span
                        key={k}
                        className={cn("h-1 w-1 rounded-full", phase ? PHASE_DOT[phase] : "bg-primary")}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem] text-muted-foreground md:text-xs">
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
