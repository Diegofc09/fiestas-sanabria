import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Users } from "lucide-react";

import { listEngagement, listRecentComments } from "@/lib/engagement.functions";
import { formatRating, supportsEvent, type Engagement, type PostComment } from "@/lib/engagement";
import { cn } from "@/lib/utils";
import { Stars } from "./Stars";

/** Datos de participación compartidos (una sola petición para todas las tarjetas). */
export function useEngagement() {
  const engagement = useQuery({
    queryKey: ["engagement"],
    queryFn: () => listEngagement() as Promise<Engagement[]>,
    staleTime: 60_000,
  });
  const comments = useQuery({
    queryKey: ["recent-comments"],
    queryFn: () => listRecentComments({ data: { limit: 150 } }) as Promise<PostComment[]>,
    staleTime: 60_000,
  });
  return {
    forPost: (postId: string) => ({
      stats: engagement.data?.find((e) => e.post_id === postId),
      comment: comments.data?.find((c) => c.post_id === postId),
    }),
  };
}

/**
 * Sustituye a la entradilla en las tarjetas: muestra el último comentario,
 * la puntuación media y la asistencia prevista.
 */
export function CommentTeaser({
  postId,
  category,
  className,
  lines = 2,
}: {
  postId: string;
  category: string;
  className?: string;
  lines?: 2 | 3;
}) {
  const { forPost } = useEngagement();
  const { stats, comment } = forPost(postId);
  const isEvent = supportsEvent(category);
  const count = stats?.comments_count ?? 0;

  return (
    <div className={cn("mt-3", className)}>
      {comment ? (
        <blockquote className="border-l-2 border-rule pl-3">
          <p
            className={cn(
              "font-[family-name:var(--font-serif)] text-[0.9375rem] italic leading-relaxed text-muted-foreground",
              lines === 3 ? "line-clamp-3" : "line-clamp-2",
            )}
          >
            “{comment.body}”
          </p>
          <footer className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.8125rem] text-muted-foreground">
            <span className="font-medium text-foreground">{comment.author_name}</span>
            {isEvent && comment.rating != null && <Stars value={comment.rating} />}
          </footer>
        </blockquote>
      ) : (
        <p className="text-[0.9375rem] text-muted-foreground">
          Todavía no hay comentarios. Sé el primero en opinar.
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          {count} {count === 1 ? "comentario" : "comentarios"}
        </span>
        {isEvent && stats?.rating_avg != null && (
          <span className="inline-flex items-center gap-1.5">
            <Stars value={stats.rating_avg} />
            <span className="font-medium text-foreground">{formatRating(stats.rating_avg)}</span>
            <span>({stats.rating_count})</span>
          </span>
        )}
        {isEvent && (stats?.attendance_count ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {stats?.attendance_count} asistirán
          </span>
        )}
      </div>
    </div>
  );
}
