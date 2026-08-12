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

/** Registra una visita a cualquier página pública del sitio. */
export const trackSiteView = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ path: z.string().trim().min(1).max(300) }).parse(data),
  )
  .handler(async ({ data }) => {
    const path = data.path.split("?")[0]?.slice(0, 300) ?? "/";
    if (path.startsWith("/admin") || path.startsWith("/api")) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("site_views").insert({ path });
    return { ok: true };
  });

export type DailyViews = { day: string; views: number };

/** Visitas diarias del sitio para el gráfico del panel. */
export const adminSiteViewDaily = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ days: z.number().int().min(7).max(180).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("site_view_daily", {
      _days: data.days ?? 30,
    });
    if (error) throw new Error(error.message);
    return (rows ?? []) as DailyViews[];
  });
