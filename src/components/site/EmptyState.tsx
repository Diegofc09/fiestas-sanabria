import { Link } from "@tanstack/react-router";
import { CalendarDays, Compass, Sparkles } from "lucide-react";

export type EmptySuggestion =
  | { label: string; to: string; onClick?: never }
  | { label: string; onClick: () => void; to?: never };

export function EmptyState({
  title = "Todavía no hay publicaciones",
  description = "Estamos preparando los primeros contenidos sobre fiestas, eventos y noticias de Sanabria. Vuelve pronto.",
  kicker = "Sanabria",
  suggestions = [],
  suggestionsLabel = "Prueba con estas sugerencias",
}: {
  title?: string;
  description?: string;
  kicker?: string;
  suggestions?: EmptySuggestion[];
  suggestionsLabel?: string;
}) {
  return (
    <section
      aria-live="polite"
      className="glass-card mt-10 overflow-hidden rounded-3xl border border-border px-6 py-14 text-center md:px-12 md:py-20"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" aria-hidden="true" />
      </span>

      <p className="eyebrow mt-6 text-muted-foreground">{kicker}</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight md:text-4xl">
        {title}
      </h2>
      <span className="mx-auto mt-5 block h-px w-16 bg-border" aria-hidden="true" />
      <p className="mx-auto mt-5 max-w-lg text-base font-light leading-relaxed text-muted-foreground">
        {description}
      </p>

      {suggestions.length > 0 && (
        <nav aria-label={suggestionsLabel} className="mt-8">
          <p className="eyebrow text-muted-foreground">{suggestionsLabel}</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2.5">
            {suggestions.map((s) => (
              <li key={s.label}>
                {s.to ? (
                  <Link
                    to={s.to}
                    className="hover-lift inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[0.9375rem] font-medium text-foreground hover:border-primary hover:text-primary"
                  >
                    <Compass className="h-4 w-4 text-primary" aria-hidden="true" />
                    {s.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={s.onClick}
                    className="hover-lift inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[0.9375rem] font-medium text-foreground hover:border-primary hover:text-primary"
                  >
                    <Compass className="h-4 w-4 text-primary" aria-hidden="true" />
                    {s.label}
                  </button>
                )}
              </li>
            ))}
            <li>
              <Link
                to="/calendario"
                className="hover-lift inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[0.9375rem] font-medium text-foreground hover:border-primary hover:text-primary"
              >
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                Ver el calendario
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </section>
  );
}
