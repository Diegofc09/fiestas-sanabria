import { eventPhase, eventPhaseLabel } from "@/lib/posts";
import { cn } from "@/lib/utils";

/** Subtítulo de estado del evento: Sin empezar / En curso / Terminada. */
export function EventPhaseBadge({
  post,
  className,
}: {
  post: { event_date?: string | null; event_end_date?: string | null };
  className?: string;
}) {
  const phase = eventPhase(post);
  if (!phase) return null;
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        phase === "upcoming" &&
          "border-phase-upcoming/45 bg-phase-upcoming/12 text-phase-upcoming",
        phase === "ongoing" && "border-phase-ongoing/45 bg-phase-ongoing/12 text-phase-ongoing",
        phase === "finished" && "border-phase-finished/40 bg-phase-finished/10 text-phase-finished",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          phase === "upcoming" && "bg-phase-upcoming",
          phase === "ongoing" && "animate-pulse bg-phase-ongoing",
          phase === "finished" && "bg-phase-finished",
        )}
        aria-hidden="true"
      />
      {eventPhaseLabel(phase)}
    </span>
  );
}

