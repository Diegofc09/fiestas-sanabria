import { Moon, Sun } from "lucide-react";

import { toggleTheme, useThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Botón manual de modo oscuro. En modo automático se activa solo a las 20:00. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, resolved } = useThemeMode();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={
        mode === "auto"
          ? "Modo automático (oscuro a partir de las 20:00)"
          : isDark
            ? "Modo oscuro"
            : "Modo claro"
      }
      aria-pressed={isDark}
      className={cn(
        "glow-hover inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95",
        className,
      )}
    >
      {isDark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </button>
  );
}
