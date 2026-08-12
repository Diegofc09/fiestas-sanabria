import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const listSchema = z.object({
  category: z.enum(["fiestas", "eventos", "noticias", "otros"]).optional(),
  limit: z.number().int().min(1).max(60).optional(),
});

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(120),
  cover_image_url: z.string().max(600).nullable().optional(),
  cover_image_alt: z.string().max(300).nullable().optional(),
  excerpt: z.string().max(600).nullable().optional(),
  content: z.string().max(200000),
  category: z.enum(["fiestas", "eventos", "noticias", "otros"]),
  featured: z.boolean(),
  status: z.enum(["draft", "pending", "published"]),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  published_at: z.string().nullable().optional(),
});

export const listPublishedPosts = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { createPublicServerClient, POST_SUMMARY_COLUMNS } = await import(
      "./supabase-public.server"
    );
    const client = createPublicServerClient();
    let query = client
      .from("posts")
      .select(POST_SUMMARY_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 40);
    if (data.category) query = query.eq("category", data.category);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPublishedPost = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(160) }).parse(data))
  .handler(async ({ data }) => {
    const { createPublicServerClient, POST_SUMMARY_COLUMNS } = await import(
      "./supabase-public.server"
    );
    const client = createPublicServerClient();
    const { data: post, error } = await client
      .from("posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) return null;
    const { data: related } = await client
      .from("posts")
      .select(POST_SUMMARY_COLUMNS)
      .eq("status", "published")
      .eq("category", post.category)
      .neq("id", post.id)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(3);
    return { post, related: related ?? [] };
  });

export const getAdminContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: isSubscriber } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "subscriber",
    });
    if (isAdmin) return { isAdmin: true as const, isSubscriber: Boolean(isSubscriber), canClaim: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    return {
      isAdmin: false as const,
      isSubscriber: Boolean(isSubscriber),
      canClaim: (count ?? 0) === 0,
    };
  });

/** Bootstrap: el primer usuario registrado puede reclamar el rol de administrador. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Ya existe un administrador.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminGetPost = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: post, error } = await context.supabase
      .from("posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return post;
  });

export const adminSavePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin && data.status === "published") {
      throw new Error("Tu publicación debe pasar por revisión antes de publicarse.");
    }

    const payload = {
      title: data.title,
      slug: data.slug,
      cover_image_url: data.cover_image_url ?? null,
      cover_image_alt: data.cover_image_alt ?? null,
      excerpt: data.excerpt ?? null,
      content: sanitizeArticleHtml(data.content),
      category: data.category,
      featured: data.featured,
      status: data.status,
      event_date: data.event_date ?? null,
      published_at:
        data.status === "published" ? (data.published_at ?? new Date().toISOString()) : data.published_at ?? null,
    };

    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("posts")
        .update(payload)
        .eq("id", data.id)
        .select("id, slug")
        .single();
      if (error) throw new Error(error.message);
      return updated;
    }

    const { data: created, error } = await context.supabase
      .from("posts")
      .insert({ ...payload, author_id: context.userId })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Un administrador aprueba (publica) o devuelve a revisión una publicación. */
export const adminSetPostStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["draft", "pending", "published"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Solo la administración puede cambiar el estado.");

    const { data: updated, error } = await context.supabase
      .from("posts")
      .update({
        status: data.status,
        published_at: data.status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .select("id, slug, status")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });
