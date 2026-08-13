import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { getAttendance, setAttendance } from "@/lib/engagement.functions";
import { getVisitorToken } from "@/lib/engagement";

/** Pregunta de asistencia y contador público. */
export function AttendanceBox({ postId, eventDate }: { postId: string; eventDate?: string | null }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");

  useEffect(() => setToken(getVisitorToken()), []);

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", postId, token],
    queryFn: () =>
      getAttendance({ data: { postId, visitorToken: token || undefined } }) as Promise<{
        count: number;
        attending: boolean;
      }>,
    enabled: Boolean(token),
  });

  const mutate = useMutation({
    mutationFn: (attending: boolean) =>
      setAttendance({ data: { postId, visitorToken: token, attending } }),
    onSuccess: async (_res, attending) => {
      toast.success(attending ? "¡Apuntado! Gracias por confirmar." : "Has retirado tu asistencia.");
      await queryClient.invalidateQueries({ queryKey: ["attendance", postId] });
      await queryClient.invalidateQueries({ queryKey: ["engagement"] });
    },
    onError: () => toast.error("No se ha podido registrar tu asistencia."),
  });

  const attending = data?.attending ?? false;
  const count = data?.count ?? 0;

  return (
    <section className="rounded-sm border border-rule bg-secondary/50 p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg md:text-xl">¿Vas a asistir?</h2>
          <p className="mt-1 text-[0.9375rem] text-muted-foreground md:text-sm">
            {eventDate
              ? "Confirma tu asistencia y ayuda a saber cuánta gente se espera."
              : "Dinos si piensas acudir; el contador es público."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-[family-name:var(--font-display)] text-2xl leading-none">
              {isLoading ? "—" : count}
            </div>
            <div className="inline-flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              asistentes
            </div>
          </div>
          <button
            type="button"
            disabled={!token || mutate.isPending}
            onClick={() => mutate.mutate(!attending)}
            className={
              attending
                ? "inline-flex h-11 items-center gap-2 rounded-sm border border-primary px-5 text-sm font-medium text-primary transition-all hover:bg-primary/5 disabled:opacity-60"
                : "inline-flex h-11 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
            }
          >
            {mutate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : attending ? (
              <Check className="h-4 w-4" />
            ) : null}
            {attending ? "Voy a asistir" : "Sí, voy a asistir"}
          </button>
        </div>
      </div>
    </section>
  );
}
