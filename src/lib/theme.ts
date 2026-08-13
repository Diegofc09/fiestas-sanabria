import { useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "fs-theme";
/** A partir de esta hora local se activa el modo noche en modo automático. */
export const NIGHT_START_HOUR = 20;
export const NIGHT_END_HOUR = 7;

const listeners = new Set<() => void>();
let mode: ThemeMode = "auto";
let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

/** ¿Toca modo noche por la hora local del visitante? */
export function isNightNow(now = new Date()): boolean {
  const hour = now.getHours();
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

export function resolveTheme(value: ThemeMode): "light" | "dark" {
  if (value === "auto") return isNightNow() ? "dark" : "light";
  return value;
}

function apply() {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

function emit() {
  for (const l of listeners) l();
}

function readStored(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" || raw === "auto" ? raw : "auto";
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  mode = readStored();
  apply();
  // En modo automático revisamos la hora cada minuto para cambiar a las 20:00.
  timer = setInterval(() => {
    if (mode === "auto") apply();
  }, 60_000);
}

export function setThemeMode(next: ThemeMode) {
  mode = next;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  apply();
  emit();
}

/** Alterna manualmente entre claro y oscuro (deja de seguir la hora). */
export function toggleTheme() {
  setThemeMode(resolveTheme(mode) === "dark" ? "light" : "dark");
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
      started = false;
    }
  };
}

export function useThemeMode(): { mode: ThemeMode; resolved: "light" | "dark" } {
  const value = useSyncExternalStore(
    subscribe,
    () => mode,
    () => "auto" as ThemeMode,
  );
  return { mode: value, resolved: resolveTheme(value) };
}

/** Script en línea que evita el parpadeo aplicando el tema antes de hidratar. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var m=localStorage.getItem('${STORAGE_KEY}')||'auto';var h=new Date().getHours();var d=m==='dark'||(m==='auto'&&(h>=${NIGHT_START_HOUR}||h<${NIGHT_END_HOUR}));document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
