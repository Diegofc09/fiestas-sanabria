import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Estrellas de solo lectura. */
export function Stars({
  value,
  className,
  size = "sm",
}: {
  value: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const dimension = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span className={cn("inline-flex items-center gap-0.5 align-middle", className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            dimension,
            i <= Math.round(value) ? "fill-primary text-primary" : "text-rule",
          )}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

/** Selector de puntuación de 1 a 5 estrellas. */
export function StarPicker({
  value,
  onChange,
  className,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="radiogroup" aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} de 5 estrellas`}
          onClick={() => onChange(value === i ? null : i)}
          className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Star
            className={cn(
              "h-6 w-6",
              value != null && i <= value ? "fill-primary text-primary" : "text-muted-foreground",
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
      {value != null && (
        <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
      )}
    </div>
  );
}
