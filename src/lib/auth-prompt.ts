import { useSyncExternalStore } from "react";

let reason: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Abre el aviso de "crea una cuenta" con un motivo concreto. */
export function openAuthPrompt(value = "Crea una cuenta o inicia sesión para guardar publicaciones y comentar") {
  reason = value;
  emit();
}

export function closeAuthPrompt() {
  reason = null;
  emit();
}

export function useAuthPrompt(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => reason,
    () => null,
  );
}
