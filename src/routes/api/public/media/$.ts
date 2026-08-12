import { createFileRoute } from "@tanstack/react-router";

/**
 * Sirve imágenes del bucket privado únicamente cuando pertenecen a una
 * publicación ya publicada. Las imágenes de borradores o de publicaciones
 * en revisión no son accesibles públicamente.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const raw = (params as { _splat?: string })._splat ?? "";
        const path = decodeURIComponent(raw);
        if (!path || path.includes("..") || !/^[A-Za-z0-9/_.-]+$/.test(path)) {
          return new Response("Not found", { status: 404 });
        }

        const { createPublicServerClient } = await import("@/lib/supabase-public.server");
        const publicClient = createPublicServerClient();
        const url = `/api/public/media/${path}`;
        const { data: match } = await publicClient
          .from("posts")
          .select("id")
          .eq("status", "published")
          .or(`cover_image_url.eq.${url},content.ilike.%${path}%`)
          .limit(1)
          .maybeSingle();

        if (!match) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("post-images").download(path);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
