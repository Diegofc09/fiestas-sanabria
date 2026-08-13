import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type SessionState = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  username: string | null;
};

const initial: SessionState = { loading: true, userId: null, email: null, username: null };

/** Estado de sesión del visitante más su nombre público (si lo tiene). */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(initial);

  useEffect(() => {
    let active = true;

    const load = async (userId: string | null, email: string | null) => {
      if (!userId) {
        if (active) setState({ loading: false, userId: null, email: null, username: null });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();
      if (active) {
        setState({
          loading: false,
          userId,
          email,
          username: data?.username?.trim() || (email ? email.split("@")[0]! : null),
        });
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      void load(data.session?.user.id ?? null, data.session?.user.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      void load(session?.user.id ?? null, session?.user.email ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
