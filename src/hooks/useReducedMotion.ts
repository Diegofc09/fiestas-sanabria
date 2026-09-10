import { useEffect, useState } from "react";

/**
 * Preferencia de "reducir animaciones": respeta prefers-reduced-motion del
 * sistema y permite además activarla manualmente desde la propia web.
 */
const KEY = "fs-reduce-motion";
const CLASS = "fs-reduce-motion";

type Choice = "auto" | "on" | "off";

function readChoice(): Choice {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "on" || raw === "off" ? raw : "auto";
  } catch {
    return "auto";
  }
}

function systemPrefers(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function apply(reduced: boolean) {
  document.documentElement.classList.toggle(CLASS, reduced);
}

export function useReducedMotion() {
  const [choice, setChoice] = useState<Choice>("auto");
  const [system, setSystem] = useState(false);
  const reduced = choice === "auto" ? system : choice === "on";

  // Sólo en cliente: evita desajustes de hidratación.
  useEffect(() => {
    setChoice(readChoice());
    setSystem(systemPrefers());
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    apply(reduced);
  }, [reduced]);

  const setReduced = (next: boolean) => {
    setChoice(next ? "on" : "off");
    try {
      window.localStorage.setItem(KEY, next ? "on" : "off");
    } catch {
      /* almacenamiento no disponible */
    }
  };

  return { reduced, setReduced, followsSystem: choice === "auto" };
}
