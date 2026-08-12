import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { PostForm } from "@/components/admin/PostForm";
import { adminGetPost } from "@/lib/posts.functions";
import type { Post } from "@/lib/posts";

export const Route = createFileRoute("/_authenticated/admin/editar/$id")({
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-post", id],
    queryFn: () => adminGetPost({ data: { id } }) as Promise<Post | null>,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando publicación…
      </div>
    );
  }

  if (!data) {
    return <p className="py-20 text-muted-foreground">No se ha encontrado la publicación.</p>;
  }

  return <PostForm post={data} />;
}
