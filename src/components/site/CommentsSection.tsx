import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, UserRound } from "lucide-react";
import { toast } from "sonner";

import { listPostComments, submitComment } from "@/lib/engagement.functions";
import {
  commentCooldownLeft,
  commentSchema,
  formatRating,
  markCommentSent,
  type PostComment,
} from "@/lib/engagement";
import { formatDate } from "@/lib/posts";
import { useSession } from "@/hooks/useSession";
import { openAuthPrompt } from "@/lib/auth-prompt";
import { StarPicker, Stars } from "./Stars";

/** Comentarios de usuarios con cuenta y puntuación opcional de 1 a 5 estrellas. */
export function CommentsSection({
  postId,
  withRating,
}: {
  postId: string;
  withRating: boolean;
}) {
  const queryClient = useQueryClient();
  const { userId, username } = useSession();
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setCooldown(commentCooldownLeft());
    const timer = window.setInterval(() => setCooldown(commentCooldownLeft()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => listPostComments({ data: { postId } }) as Promise<PostComment[]>,
  });

  const send = useMutation({
    mutationFn: () =>
      submitComment({
        data: commentSchema.parse({
          postId,
          body,
          rating: withRating ? rating : null,
          honeypot,
        }),
      }),
    onSuccess: async () => {
      setBody("");
      setRating(null);
      markCommentSent();
      setCooldown(commentCooldownLeft());
      toast.success("¡Comentario publicado!");
      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      await queryClient.invalidateQueries({ queryKey: ["engagement"] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message.length < 120
          ? error.message
          : "Revisa tu comentario e inténtalo de nuevo.",
      ),
  });

  const rated = (comments ?? []).filter((c) => c.rating != null);
  const average = rated.length
    ? rated.reduce((sum, c) => sum + (c.rating ?? 0), 0) / rated.length
    : null;

  return (
    <section className="glass-card rounded-2xl p-5 shadow-neon md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-bold md:text-2xl">Comentarios</h2>
        {withRating && average != null && (
          <div className="flex items-center gap-2 text-[0.9375rem] text-muted-foreground md:text-sm">
            <Stars value={average} size="md" />
            <span className="font-medium text-foreground">{formatRating(average)}</span>
            <span>· {rated.length} valoraciones</span>
          </div>
        )}
      </div>

      {userId ? (
        <form
          className="mt-6 rounded-2xl border border-border/70 bg-background/60 p-4 md:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (cooldown > 0) {
              toast.error(`Espera ${cooldown} s antes de enviar otro comentario.`);
              return;
            }
            const parsed = commentSchema.safeParse({
              postId,
              body,
              rating: withRating ? rating : null,
              honeypot,
            });
            if (!parsed.success) {
              toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos.");
              return;
            }
            send.mutate();
          }}
        >
          <p className="inline-flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
            <UserRound className="h-4 w-4 text-neon-cyan" aria-hidden="true" />
            Comentas como <span className="font-medium text-foreground">{username ?? "tú"}</span>
          </p>

          {withRating && (
            <div className="mt-4">
              <label className="eyebrow block text-muted-foreground">Tu puntuación (opcional)</label>
              <StarPicker value={rating} onChange={setRating} className="mt-2" />
            </div>
          )}

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="¿Qué te ha parecido? Cuéntalo aquí"
            aria-label="Tu comentario"
            className="mt-3 w-full rounded-sm border border-border/70 bg-background px-3 py-2.5 text-base md:text-sm"
          />

          {/* Campo trampa anti spam: invisible para personas */}
          <input
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.8125rem] text-muted-foreground">
              Los comentarios se publican al instante; un filtro bloquea el lenguaje ofensivo.
              {cooldown > 0 && ` Podrás comentar de nuevo en ${cooldown} s.`}
            </p>
            <button
              type="submit"
              disabled={send.isPending || cooldown > 0}
              className="glow-hover inline-flex h-11 items-center gap-2 rounded-full border border-neon-violet/70 bg-neon-violet/20 px-5 text-sm font-semibold text-foreground shadow-[var(--glow-violet)] disabled:opacity-60"
            >
              {send.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {cooldown > 0 ? `Espera ${cooldown} s` : "Enviar comentario"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neon-violet/40 bg-background/60 p-5">
          <p className="text-[0.9375rem] text-muted-foreground">
            Crea una cuenta o inicia sesión para comentar y valorar esta publicación.
          </p>
          <button
            type="button"
            onClick={() =>
              openAuthPrompt(
                "Crea una cuenta o inicia sesión para guardar publicaciones y comentar",
              )
            }
            className="glow-hover inline-flex h-11 items-center rounded-full border border-neon-violet/70 bg-neon-violet/20 px-5 text-sm font-semibold text-foreground shadow-[var(--glow-violet)]"
          >
            Acceder para comentar
          </button>
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <p className="text-muted-foreground">Cargando comentarios…</p>
        ) : (comments ?? []).length === 0 ? (
          <p className="inline-flex items-center gap-2 text-[0.9375rem] text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Todavía no hay comentarios publicados.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {(comments ?? []).map((comment) => (
              <li key={comment.id} className="py-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium">{comment.author_name}</span>
                  <time
                    dateTime={comment.created_at}
                    className="text-[0.8125rem] text-muted-foreground"
                  >
                    {formatDate(comment.created_at)}
                  </time>
                  {withRating && comment.rating != null && <Stars value={comment.rating} />}
                </div>
                <p className="mt-2 whitespace-pre-line text-[1.0625rem] font-light leading-relaxed text-muted-foreground">
                  {comment.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
