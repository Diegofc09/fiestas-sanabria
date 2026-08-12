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
        phase === "ongoing" && "border-primary/40 bg-secondary text-primary",
        phase === "upcoming" && "border-rule text-muted-foreground",
        phase === "finished" && "border-rule text-muted-foreground opacity-80",
        className,
      )}
    >
      {phase === "ongoing" && (
        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
      )}
      {eventPhaseLabel(phase)}
    </span>
  );
}
