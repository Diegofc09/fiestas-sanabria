import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  adminCreateInviteCode,
  adminDeleteInviteCode,
  adminListInviteCodes,
} from "@/lib/invites.functions";
import { formatDateShort } from "@/lib/posts";

type InviteCode = {
  id: string;
  code: string;
  note: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export function InviteCodes() {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [days, setDays] = useState("30");

  const { data: codes, isLoading } = useQuery({
    queryKey: ["invite-codes"],
    queryFn: () => adminListInviteCodes() as Promise<InviteCode[]>,
  });

  const create = useMutation({
    mutationFn: () =>
      adminCreateInviteCode({
        data: { note: note.trim() || null, expiresInDays: days ? Number(days) : null },
      }),
    onSuccess: async () => {
      setNote("");
      toast.success("Código generado.");
      await queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se ha podido generar."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteInviteCode({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invite-codes"] });
    },
  });

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado.");
    } catch {
      toast.error("Copia el código manualmente.");
    }
  };

  return (
    <section className="mt-14 rounded-sm border border-rule bg-paper p-5 md:p-6">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-primary" />
        <h2 className="font-[family-name:var(--font-display)] text-xl">Códigos de suscriptor</h2>
      </div>
      <p className="mt-2 max-w-2xl font-[family-name:var(--font-serif)] text-sm text-muted-foreground">
        Genera un código y entrégalo a quien quieras dar acceso. Al canjearlo en el panel podrá
        redactar publicaciones que quedarán en revisión hasta que las apruebes.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="code-note" className="mb-1.5 block text-sm font-medium">
            Nota (opcional)
          </label>
          <input
            id="code-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Para quién es este código"
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="w-32">
          <label htmlFor="code-days" className="mb-1.5 block text-sm font-medium">
            Caduca (días)
          </label>
          <input
            id="code-days"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Generar código
        </button>
      </div>

      {isLoading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando códigos…
        </div>
      ) : !codes || codes.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Todavía no has generado ningún código.</p>
      ) : (
        <ul className="mt-6 divide-y divide-rule border-t border-rule">
          {codes.map((code) => {
            const expired = code.expires_at && new Date(code.expires_at) < new Date();
            return (
              <li key={code.id} className="flex flex-wrap items-center gap-3 py-3">
                <code className="rounded-sm bg-secondary px-2 py-1 font-mono text-sm tracking-wider text-primary">
                  {code.code}
                </code>
                <span className="text-xs text-muted-foreground">
                  {code.used_at
                    ? `Canjeado el ${formatDateShort(code.used_at)}`
                    : expired
                      ? "Caducado"
                      : code.expires_at
                        ? `Válido hasta el ${formatDateShort(code.expires_at)}`
                        : "Sin caducidad"}
                </span>
                {code.note && <span className="text-xs text-muted-foreground">· {code.note}</span>}
                <div className="ml-auto flex items-center gap-1.5">
                  {!code.used_at && !expired && (
                    <button
                      type="button"
                      onClick={() => void copy(code.code)}
                      title="Copiar código"
                      aria-label="Copiar código"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-input text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove.mutate(code.id)}
                    title="Eliminar código"
                    aria-label="Eliminar código"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-input text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
