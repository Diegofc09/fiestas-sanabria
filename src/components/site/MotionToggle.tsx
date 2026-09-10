import { Sparkles, Zap } from "lucide-react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Interruptor accesible para reducir las animaciones del sitio.
 * Por defecto sigue la preferencia del sistema (prefers-reduced-motion).
 */
export function MotionToggle({ className }: { className?: string }) {
  const { reduced, setReduced } = useReducedMotion();

  return (
    <>
      <button
        type="button"
        onClick={() => setReduced(!reduced)}
        aria-pressed={reduced}
        aria-describedby="motion-toggle-ayuda"
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full border border-current/25 px-4 py-2 text-[0.8125rem] font-medium transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-sm",
          className,
        )}
      >
        {reduced ? (
          <Zap className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        {reduced ? "Animaciones reducidas" : "Reducir animaciones"}
      </button>
      <span id="motion-toggle-ayuda" className="sr-only">
        Desactiva las transiciones y efectos del listado y de las tarjetas.
      </span>
      <span aria-live="polite" className="sr-only">
        {reduced ? "Animaciones reducidas activadas." : ""}
      </span>
    </>
  );
}
