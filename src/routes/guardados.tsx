import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";

import { listSavedPosts } from "@/lib/saved.functions";
import type { PostSummary } from "@/lib/posts";
import { FeedGrid } from "@/components/site/FeedCard";
import { EmptyState } from "@/components/site/EmptyState";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/guardados")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mis guardados — FiestasSanabria" },
      {
        name: "description",
        content:
          "Tu espacio personal en FiestasSanabria: las publicaciones que guardas no caducan a los 14 días.",
      },
      { property: "og:title", content: "Mis guardados — FiestasSanabria" },
      {
        property: "og:description",
        content:
          "Tu espacio personal en FiestasSanabria: las publicaciones que guardas no caducan a los 14 días.",
      },
      { property: "og:url", content: "/guardados" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/guardados" }],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { userId, loading } = useSession();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["saved-posts", userId],
    queryFn: () => listSavedPosts() as Promise<PostSummary[]>,
    enabled: Boolean(userId),
  });

  return (
    <div className="mx-auto max-w-6xl px-5 pb-14 md:px-8">
      <header className="pt-10 md:pt-14">
        <p className="eyebrow inline-flex items-center gap-2 text-primary">
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          Tu espacio personal
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Mis guardados</h1>
        <p className="mt-3 max-w-2xl text-[0.9375rem] font-light text-muted-foreground">
          Las publicaciones normales desaparecen del feed a los 14 días, pero las que guardas aquí
          se quedan contigo de forma permanente.
        </p>
      </header>

      <div className="mt-8">
        {loading ? (
          <p className="text-muted-foreground">Cargando…</p>
        ) : !userId ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-[0.9375rem] text-muted-foreground">
              Crea una cuenta o inicia sesión para guardar publicaciones y comentar.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/auth"
                search={{ mode: "signup", redirect: "/guardados" }}
                className="glow-hover rounded-full border border-primary bg-primary/10 px-5 py-2.5 text-sm font-semibold text-foreground"
              >
                Registrarse
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signin", redirect: "/guardados" }}
                className="glow-hover rounded-full border border-border/70 bg-secondary/40 px-5 py-2.5 text-sm font-medium text-muted-foreground"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        ) : isLoading ? (
          <p className="text-muted-foreground">Cargando tus guardados…</p>
        ) : (posts ?? []).length === 0 ? (
          <EmptyState
            title="Aún no has guardado nada"
            description="Pulsa el marcador en cualquier publicación para conservarla aquí para siempre."
          />
        ) : (
          <FeedGrid posts={posts ?? []} />
        )}
      </div>
    </div>
  );
}
