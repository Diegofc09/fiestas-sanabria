import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Star, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  adminDeleteComment,
  adminListComments,
  adminSetCommentApproval,
} from "@/lib/engagement.functions";
import { formatDateShort } from "@/lib/posts";
import type { AdminComment } from "@/lib/engagement";

/** Moderación de comentarios: aprobar, retirar o eliminar. */
export function CommentsModeration() {
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: () => adminListComments() as Promise<AdminComment[]>,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
    await queryClient.invalidateQueries({ queryKey: ["comments"] });
    await queryClient.invalidateQueries({ queryKey: ["recent-comments"] });
    await queryClient.invalidateQueries({ queryKey: ["engagement"] });
  };

  const approve = useMutation({
    mutationFn: (input: { id: string; approved: boolean }) =>
      adminSetCommentApproval({ data: input }),
    onSuccess: async (_r, input) => {
      toast.success(input.approved ? "Comentario publicado." : "Comentario retirado.");
      await refresh();
    },
    onError: () => toast.error("No se ha podido actualizar el comentario."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteComment({ data: { id } }),
    onSuccess: async () => {
      toast.success("Comentario eliminado.");
      await refresh();
    },
    onError: () => toast.error("No se ha podido eliminar el comentario."),
  });

  const pending = (comments ?? []).filter((c) => !c.approved);
  const approved = (comments ?? []).filter((c) => c.approved);

  return (
    <section className="mt-14 border-t border-rule pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl md:text-2xl">Comentarios</h2>
        <p className="text-sm text-muted-foreground">
          {pending.length} pendientes · {approved.length} publicados
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando comentarios…
        </div>
      ) : (comments ?? []).length === 0 ? (
        <p className="py-8 text-muted-foreground">Aún no hay comentarios.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rule">
          {[...pending, ...approved].map((comment) => (
            <li key={comment.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium">{comment.author_name}</span>
                  <span className="text-muted-foreground">{comment.posts?.title ?? "—"}</span>
                  <span className="text-muted-foreground">{formatDateShort(comment.created_at)}</span>
                  {comment.rating != null && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      {comment.rating}/5
                    </span>
                  )}
                  <span
                    className={
                      comment.approved
                        ? "eyebrow rounded-full bg-secondary px-2 py-0.5 text-primary"
                        : "eyebrow rounded-full border border-rule px-2 py-0.5"
                    }
                  >
                    {comment.approved ? "Publicado" : "Pendiente"}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-line text-[0.9375rem] text-muted-foreground">
                  {comment.body}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => approve.mutate({ id: comment.id, approved: !comment.approved })}
                  className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-rule px-3 text-sm transition-colors hover:bg-secondary"
                >
                  {comment.approved ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  {comment.approved ? "Retirar" : "Aprobar"}
                </button>
                <button
                  type="button"
                  onClick={() => remove.mutate(comment.id)}
                  aria-label="Eliminar comentario"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-rule text-destructive transition-colors hover:bg-secondary"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
