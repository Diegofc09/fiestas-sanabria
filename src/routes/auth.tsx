import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Acceso a la redacción — Fiestas Sanabria" },
      {
        name: "description",
        content: "Acceso privado para la redacción de Fiestas Sanabria.",
      },
      { property: "og:title", content: "Acceso a la redacción — Fiestas Sanabria" },
      { property: "og:description", content: "Acceso privado para la redacción de Fiestas Sanabria." },
      { property: "og:url", content: "/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const target = safePath(search.redirect);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: target, replace: true });
    });
  }, [navigate, target]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: target, replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${target}` },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Revisa tu correo si se requiere confirmación.");
        navigate({ to: target, replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se ha podido completar el acceso.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      sessionStorage.setItem("fs_redirect", target);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("No se ha podido iniciar sesión con Google.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: target, replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-5 py-16 md:py-24">
      <p className="eyebrow text-primary">Redacción</p>
      <h1 className="mt-3 text-3xl md:text-4xl">Acceso privado</h1>
      <p className="mt-3 font-[family-name:var(--font-serif)] text-muted-foreground">
        Área reservada a la administración de Fiestas Sanabria.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-sm border border-input bg-paper px-3 text-base outline-none transition-colors focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-sm border border-input bg-paper px-3 text-base outline-none transition-colors focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-primary text-sm font-medium text-primary-foreground transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-rule" />
        <span className="text-xs text-muted-foreground">o</span>
        <span className="h-px flex-1 bg-rule" />
      </div>

      <button
        type="button"
        onClick={google}
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-sm border border-input bg-background text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
      >
        Continuar con Google
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-6 text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        {mode === "signin" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
      </button>

      <Link to="/" className="mt-10 text-sm text-muted-foreground transition-colors hover:text-foreground">
        ← Volver a la portada
      </Link>
    </div>
  );
}
