import { useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";

export type SessionState = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  username: string | null;
};

const serverState: SessionState = {
  loading: true,
  userId: null,
  email: null,
  username: null,
};

let state: SessionState = serverState;
let started = false;
const listeners = new Set<() => void>();

function set(next: SessionState) {
  state = next;
  for (const l of listeners) l();
}

function fallbackName(email: string | null, metaName?: unknown): string | null {
  if (typeof metaName === "string" && metaName.trim().length >= 3) return metaName.trim();
  return email ? (email.split("@")[0] ?? null) : null;
}

async function load(
  userId: string | null,
  email: string | null,
  metaName?: unknown,
) {
  if (!userId) {
    set({ loading: false, userId: null, email: null, username: null });
    return;
  }
  const { data } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  let username = data?.username?.trim() || null;

  // Si el usuario aún no tiene perfil (registro con Google o confirmación por
  // correo pendiente), se crea ahora para que su nombre público exista.
  if (!username) {
    const candidate = fallbackName(email, metaName);
    if (candidate) {
      const { error } = await supabase.from("profiles").upsert({ id: userId, username: candidate });
      if (!error) username = candidate;
      else username = candidate;
    }
  }

  set({ loading: false, userId, email, username });
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user;
    void load(user?.id ?? null, user?.email ?? null, user?.user_metadata?.["username"]);
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") return;
    void load(
      session?.user.id ?? null,
      session?.user.email ?? null,
      session?.user.user_metadata?.["username"],
    );

  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Estado de sesión compartido del visitante más su nombre público. */
export function useSession(): SessionState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}
