import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { adminDeletePost, adminListPosts } from "@/lib/posts.functions";
import { categoryLabel, formatDateShort, type Post } from "@/lib/posts";
import { PostRankings } from "@/components/admin/PostRankings";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => adminListPosts() as Promise<Post[]>,
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeletePost({ data: { id } }),
    onSuccess: async () => {
      toast.success("Publicación eliminada.");
      await queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se ha podido eliminar."),
  });

  const drafts = posts?.filter((p) => p.status === "draft").length ?? 0;
  const published = posts?.filter((p) => p.status === "published").length ?? 0;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{published}</strong> publicadas
          </span>
          <span>
            <strong className="text-foreground">{drafts}</strong> borradores
          </span>
        </div>
        <Link
          to="/admin/nuevo"
          className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          Nueva publicación
        </Link>
      </div>

      <PostRankings />

      {isLoading ? (
        <div className="flex items-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando publicaciones…
        </div>
      ) : !posts || posts.length === 0 ? (
        <p className="mt-12 rounded-sm border border-dashed border-rule bg-paper p-10 text-center font-[family-name:var(--font-serif)] text-muted-foreground">
          Aún no hay publicaciones. Crea la primera.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      post.status === "published"
                        ? "eyebrow rounded-full bg-secondary px-2.5 py-0.5 text-primary"
                        : "eyebrow rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground"
                    }
                  >
                    {post.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                  <span className="text-xs text-muted-foreground">{categoryLabel(post.category)}</span>
                  {post.featured && <span className="text-xs text-primary">Destacado</span>}
                </div>
                <p className="mt-1.5 truncate font-[family-name:var(--font-display)] text-lg">{post.title}</p>
                <p className="text-xs text-muted-foreground">
                  Actualizado el {formatDateShort(post.updated_at)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {post.status === "published" && (
                  <Link
                    to="/articulo/$slug"
                    params={{ slug: post.slug }}
                    title="Ver publicación"
                    aria-label="Ver publicación"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-input text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  to="/admin/editar/$id"
                  params={{ id: post.id }}
                  title="Editar"
                  aria-label="Editar"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-input text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  title="Eliminar"
                  aria-label="Eliminar"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar «${post.title}»? Esta acción no se puede deshacer.`)) {
                      remove.mutate(post.id);
                    }
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-input text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
