import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { listSavedPostIds, toggleSavedPost } from "@/lib/saved.functions";
import { openAuthPrompt } from "@/lib/auth-prompt";
import { useSession } from "./useSession";

/** Guardados del usuario actual; si no hay sesión, invita a crear cuenta. */
export function useSavedPosts() {
  const { userId } = useSession();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["saved-ids", userId],
    queryFn: () => listSavedPostIds() as Promise<string[]>,
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const savedIds = data ?? [];

  const mutation = useMutation({
    mutationFn: (input: { postId: string; saved: boolean }) => toggleSavedPost({ data: input }),
    onSuccess: async (_result, input) => {
      toast.success(input.saved ? "Guardado en tu espacio personal" : "Quitado de guardados");
      await queryClient.invalidateQueries({ queryKey: ["saved-ids"] });
      await queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
    onError: () => toast.error("No se ha podido actualizar tu guardado."),
  });

  const toggle = (postId: string) => {
    if (!userId) {
      openAuthPrompt("Crea una cuenta o inicia sesión para guardar publicaciones y comentar");
      return;
    }
    mutation.mutate({ postId, saved: !savedIds.includes(postId) });
  };

  return {
    isSignedIn: Boolean(userId),
    savedIds,
    isSaved: (postId: string) => savedIds.includes(postId),
    toggle,
    pending: mutation.isPending,
  };
}
