import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const uuid = z.string().uuid();

const commentSchema = z.object({
  postId: uuid,
  authorName: z.string().trim().min(2).max(60),
  body: z.string().trim().min(2).max(2000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

const attendanceSchema = z.object({
  postId: uuid,
  visitorToken: z.string().trim().min(10).max(100),
  attending: z.boolean(),
});

/** Resumen público por publicación: comentarios aprobados, media de estrellas y asistentes. */
export const listEngagement = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicServerClient } = await import("./supabase-public.server");
  const client = createPublicServerClient();
  const { data, error } = await client.rpc("post_engagement");
  if (error) throw new Error(error.message);
  return data ?? [];
});

/** Últimos comentarios aprobados (para las tarjetas de portada). */
export const listRecentComments = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ limit: z.number().int().min(1).max(200).optional() }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { createPublicServerClient } = await import("./supabase-public.server");
    const client = createPublicServerClient();
    const { data: rows, error } = await client
      .from("post_comments")
      .select("id, post_id, author_name, body, rating, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 120);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listPostComments = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ postId: uuid }).parse(data))
  .handler(async ({ data }) => {
    const { createPublicServerClient } = await import("./supabase-public.server");
    const client = createPublicServerClient();
    const { data: rows, error } = await client
      .from("post_comments")
      .select("id, post_id, author_name, body, rating, created_at")
      .eq("post_id", data.postId)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Cualquiera puede enviar un comentario; queda pendiente de moderación. */
export const submitComment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => commentSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post } = await supabaseAdmin
      .from("posts")
      .select("id, status")
      .eq("id", data.postId)
      .maybeSingle();
    if (!post || post.status !== "published") throw new Error("Publicación no disponible.");

    const { error } = await supabaseAdmin.from("post_comments").insert({
      post_id: data.postId,
      author_name: data.authorName,
      body: data.body,
      rating: data.rating ?? null,
      approved: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAttendance = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ postId: uuid, visitorToken: z.string().trim().max(100).optional() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("post_attendance")
      .select("id", { count: "exact", head: true })
      .eq("post_id", data.postId);
    let attending = false;
    if (data.visitorToken && data.visitorToken.length >= 10) {
      const { data: row } = await supabaseAdmin
        .from("post_attendance")
        .select("id")
        .eq("post_id", data.postId)
        .eq("visitor_token", data.visitorToken)
        .maybeSingle();
      attending = Boolean(row);
    }
    return { count: count ?? 0, attending };
  });

/** Marca o retira la asistencia de un visitante anónimo (un voto por navegador). */
export const setAttendance = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => attendanceSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.attending) {
      const { error } = await supabaseAdmin
        .from("post_attendance")
        .upsert(
          { post_id: data.postId, visitor_token: data.visitorToken },
          { onConflict: "post_id,visitor_token" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("post_attendance")
        .delete()
        .eq("post_id", data.postId)
        .eq("visitor_token", data.visitorToken);
      if (error) throw new Error(error.message);
    }
    const { count } = await supabaseAdmin
      .from("post_attendance")
      .select("id", { count: "exact", head: true })
      .eq("post_id", data.postId);
    return { count: count ?? 0, attending: data.attending };
  });

/* ---------------- Moderación (solo administración) ---------------- */

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Solo la administración puede moderar comentarios.");
}

export const adminListComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("post_comments")
      .select("id, post_id, author_name, body, rating, approved, created_at, posts(title, slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSetCommentApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: uuid, approved: z.boolean() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("post_comments")
      .update({ approved: data.approved })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: uuid }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("post_comments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
