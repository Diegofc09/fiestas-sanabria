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

async function load(userId: string | null, email: string | null) {
  if (!userId) {
    set({ loading: false, userId: null, email: null, username: null });
    return;
  }
  const { data } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  set({
    loading: false,
    userId,
    email,
    username: data?.username?.trim() || (email ? (email.split("@")[0] ?? null) : null),
  });
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void supabase.auth.getSession().then(({ data }) => {
    void load(data.session?.user.id ?? null, data.session?.user.email ?? null);
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") return;
    void load(session?.user.id ?? null, session?.user.email ?? null);
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
