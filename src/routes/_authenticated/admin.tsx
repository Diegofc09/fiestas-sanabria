import { createFileRoute, Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { claimFirstAdmin, getAdminContext } from "@/lib/posts.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-context"],
    queryFn: () => getAdminContext(),
    staleTime: 60_000,
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const claim = async () => {
    setClaiming(true);
    try {
      await claimFirstAdmin();
      toast.success("Ya tienes acceso de administración.");
      await refetch();
      router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se ha podido asignar el rol.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="eyebrow text-primary">Panel privado</p>
          <h1 className="mt-2 text-3xl md:text-4xl">Redacción</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-sm border border-input px-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Ver el sitio
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex h-10 items-center gap-2 rounded-sm border border-input px-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Comprobando permisos…
        </div>
      ) : data?.isAdmin ? (
        <Outlet />
      ) : (
        <div className="mx-auto mt-16 max-w-lg rounded-sm border border-rule bg-paper p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-2xl">Sin permisos de administración</h2>
          <p className="mt-3 font-[family-name:var(--font-serif)] text-muted-foreground">
            {data?.canClaim
              ? "Todavía no hay ningún administrador. Puedes asignarte ese rol ahora."
              : "Tu cuenta no tiene acceso a la redacción. Solicítalo a un administrador."}
          </p>
          {data?.canClaim && (
            <button
              type="button"
              onClick={claim}
              disabled={claiming}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:opacity-95 disabled:opacity-60"
            >
              {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
              Convertirme en administrador
            </button>
          )}
        </div>
      )}
    </div>
  );
}
