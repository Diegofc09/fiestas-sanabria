import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Registra una visita a un artículo publicado (endpoint público, solo escribe un contador). */
export const trackPostView = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ postId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post } = await supabaseAdmin
      .from("posts")
      .select("id")
      .eq("id", data.postId)
      .eq("status", "published")
      .maybeSingle();
    if (!post) return { ok: false };
    await supabaseAdmin.from("post_views").insert({ post_id: post.id });
    return { ok: true };
  });

export type PostRanking = {
  post_id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  category: "fiestas" | "eventos" | "noticias" | "otros";
  views_total: number;
  views_last_30: number;
  views_prev_30: number;
};

/** Ranking de artículos: más visitados del último mes y mayor crecimiento. */
export const adminPostRankings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("post_view_rankings");
    if (error) throw new Error(error.message);
    return (data ?? []) as PostRanking[];
  });
