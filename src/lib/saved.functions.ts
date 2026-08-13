import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Métricas públicas agregadas por publicación (visitas, guardados y comentarios). */
export const listPostMetrics = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("post_metrics");
  if (error) throw new Error(error.message);
  return data ?? [];
});

/** Identificadores de las publicaciones guardadas por el usuario actual. */
export const listSavedPostIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.post_id);
  });

/** Espacio personal: publicaciones guardadas (no caducan para su dueño). */
export const listSavedPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { POST_SUMMARY_COLUMNS } = await import("./supabase-public.server");
    const { data, error } = await context.supabase
      .from("saved_posts")
      .select(`created_at, posts(${POST_SUMMARY_COLUMNS})`)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? [])
      .map((row) => row.posts)
      .filter((post): post is NonNullable<typeof post> => Boolean(post));
  });

/** Guarda o quita una publicación del espacio personal del usuario. */
export const toggleSavedPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ postId: z.string().uuid(), saved: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    if (data.saved) {
      const { error } = await context.supabase
        .from("saved_posts")
        .upsert(
          { user_id: context.userId, post_id: data.postId },
          { onConflict: "user_id,post_id" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("saved_posts")
        .delete()
        .eq("user_id", context.userId)
        .eq("post_id", data.postId);
      if (error) throw new Error(error.message);
    }
    return { saved: data.saved };
  });
