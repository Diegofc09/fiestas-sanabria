import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Crear cuenta o iniciar sesión — FiestasSanabria" },
      {
        name: "description",
        content:
          "Crea tu cuenta en FiestasSanabria para guardar publicaciones sin caducidad y comentar las fiestas de la comarca.",
      },
      { property: "og:title", content: "Crear cuenta o iniciar sesión — FiestasSanabria" },
      {
        property: "og:description",
        content:
          "Crea tu cuenta en FiestasSanabria para guardar publicaciones sin caducidad y comentar las fiestas de la comarca.",
      },
      { property: "og:url", content: "/auth" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/guardados";
  return value;
}

const usernameSchema = z
  .string()
  .trim()
  .min(3, "El nombre de usuario necesita al menos 3 caracteres")
  .max(24, "Máximo 24 caracteres")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Usa solo letras, números, puntos, guiones o guiones bajos");

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const target = safePath(search.redirect);

  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
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
        const name = usernameSchema.parse(username);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${target}`,
            data: { username: name },
          },
        });
        if (error) throw error;
        // El perfil solo se puede escribir con sesión activa; si el registro
        // requiere confirmación por correo, se creará al iniciar sesión.
        if (data.session && data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({ id: data.user.id, username: name });
          if (profileError?.code === "23505") {
            toast.error("Ese nombre de usuario ya está en uso. Podrás cambiarlo más tarde.");
          }
        }
        toast.success(
          data.session
            ? "Cuenta creada. Ya puedes guardar publicaciones y comentar."
            : "Cuenta creada. Revisa tu correo para confirmarla.",
        );
        if (data.session) navigate({ to: target, replace: true });
      }
    } catch (error) {
      const message =
        error instanceof z.ZodError
          ? (error.issues[0]?.message ?? "Datos no válidos.")
          : error instanceof Error
            ? error.message
            : "No se ha podido completar el acceso.";
      toast.error(message);
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
      <p className="eyebrow text-neon-cyan">Tu cuenta</p>
      <h1 className="text-glow-violet mt-3 text-3xl font-bold md:text-4xl">
        {mode === "signin" ? "Iniciar sesión" : "Crear una cuenta"}
      </h1>
      <p className="mt-3 text-[0.9375rem] font-light text-muted-foreground">
        Guarda publicaciones para que no caduquen a los 14 días y comenta las fiestas de Sanabria.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
              Nombre de usuario público
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="p. ej. sanabres91"
              className="h-11 w-full rounded-sm border border-input bg-secondary/40 px-3 text-base outline-none transition-colors focus:border-neon-violet"
            />
          </div>
        )}
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
            className="h-11 w-full rounded-sm border border-input bg-secondary/40 px-3 text-base outline-none transition-colors focus:border-neon-violet"
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
            className="h-11 w-full rounded-sm border border-input bg-secondary/40 px-3 text-base outline-none transition-colors focus:border-neon-violet"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="glow-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-neon-violet/70 bg-neon-violet/20 text-sm font-semibold text-foreground shadow-[var(--glow-violet)] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-rule" />
        <span className="text-sm text-muted-foreground">o</span>
        <span className="h-px flex-1 bg-rule" />
      </div>

      <button
        type="button"
        onClick={google}
        disabled={loading}
        className="glow-hover inline-flex h-11 w-full items-center justify-center rounded-full border border-border/70 bg-secondary/50 text-sm font-medium transition-colors disabled:opacity-60"
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
