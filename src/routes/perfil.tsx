import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bookmark, CalendarDays, MessageCircle, PenLine, Users } from "lucide-react";

import { listSavedPosts } from "@/lib/saved.functions";
import { listMyComments, listMyPosts } from "@/lib/profile.functions";
import { categoryLabel, formatDate, statusLabel, timelineDate, type PostCategory, type PostStatus, type PostSummary } from "@/lib/posts";
import { FeedGrid } from "@/components/site/FeedCard";
import { EmptyState } from "@/components/site/EmptyState";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

type MyComment = {
  id: string;
  body: string;
  rating: number | null;
  created_at: string;
  post_id: string;
  posts: { title: string; slug: string } | null;
};

type MyPost = {
  id: string;
  title: string;
  slug: string;
  category: PostCategory;
  status: PostStatus;
  event_date: string | null;
  event_end_date: string | null;
  created_at: string;
};

export const Route = createFileRoute("/perfil")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mi perfil — FiestasSanabria" },
      {
        name: "description",
        content:
          "Tu espacio en FiestasSanabria: fiestas guardadas, tus comentarios, tus publicaciones y tus conexiones.",
      },
      { property: "og:title", content: "Mi perfil — FiestasSanabria" },
      {
        property: "og:description",
        content: "Tu espacio en FiestasSanabria: fiestas guardadas, comentarios y publicaciones.",
      },
      { property: "og:url", content: "/perfil" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/perfil" }],
  }),
  component: ProfilePage,
});

type Tab = "para-ti" | "fiestas" | "comentarios" | "publicaciones" | "conexiones";

const TABS: { value: Tab; label: string }[] = [
  { value: "para-ti", label: "Para ti" },
  { value: "fiestas", label: "Mis fiestas" },
  { value: "comentarios", label: "Mis comentarios" },
  { value: "publicaciones", label: "Mis publicaciones" },
  { value: "conexiones", label: "Conexiones" },
];

function ProfilePage() {
  const { userId, username, email, loading } = useSession();
  const [tab, setTab] = useState<Tab>("para-ti");

  const saved = useQuery({
    queryKey: ["saved-posts", userId],
    queryFn: () => listSavedPosts() as Promise<PostSummary[]>,
    enabled: Boolean(userId),
  });
  const comments = useQuery({
    queryKey: ["my-comments", userId],
    queryFn: () => listMyComments() as Promise<MyComment[]>,
    enabled: Boolean(userId),
  });
  const mine = useQuery({
    queryKey: ["my-posts", userId],
    queryFn: () => listMyPosts() as Promise<MyPost[]>,
    enabled: Boolean(userId),
  });

  if (loading) {
    return <p className="mx-auto max-w-6xl px-5 py-16 text-muted-foreground md:px-8">Cargando…</p>;
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center md:px-8">
        <h1 className="text-3xl font-bold">Mi perfil</h1>
        <p className="mt-3 text-[0.9375rem] text-muted-foreground">
          Entra con tu cuenta para ver tus fiestas guardadas, tus comentarios y tus conexiones.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/auth"
            search={{ mode: "signup", redirect: "/perfil" }}
            className="glow-hover rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Crear cuenta
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin", redirect: "/perfil" }}
            className="glow-hover rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-foreground"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const savedPosts = saved.data ?? [];
  const myComments = comments.data ?? [];
  const myPosts = mine.data ?? [];
  const upcomingSaved = savedPosts
    .filter((p) => p.event_date)
    .sort((a, b) => new Date(timelineDate(a)).getTime() - new Date(timelineDate(b)).getTime());

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
      <header className="flex flex-wrap items-center gap-4 pt-10 md:pt-14">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xl font-bold text-primary"
          aria-hidden="true"
        >
          {(username ?? email ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="eyebrow text-primary">Tu espacio</p>
          <h1 className="mt-1 truncate text-3xl font-bold md:text-4xl">{username ?? "Mi perfil"}</h1>
          {email && <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>}
        </div>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Bookmark className="h-4 w-4" />} value={savedPosts.length} label="Guardadas" />
        <Stat icon={<CalendarDays className="h-4 w-4" />} value={upcomingSaved.length} label="Con fecha" />
        <Stat icon={<MessageCircle className="h-4 w-4" />} value={myComments.length} label="Comentarios" />
        <Stat icon={<PenLine className="h-4 w-4" />} value={myPosts.length} label="Publicaciones" />
      </dl>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Secciones del perfil">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            aria-pressed={tab === t.value}
            className={cn(
              "glow-hover rounded-full border px-4 py-2 text-[0.8125rem] font-medium md:text-sm",
              tab === t.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-8">
        {tab === "para-ti" && (
          <section className="space-y-8">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">Tus próximas fiestas</h2>
              {upcomingSaved.length === 0 ? (
                <EmptyState
                  title="Nada en tu agenda"
                  description="Guarda cualquier fiesta con el marcador y aparecerá aquí ordenada por fecha."
                />
              ) : (
                <div className="mt-5">
                  <FeedGrid posts={upcomingSaved.slice(0, 4)} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/calendario"
                className="glow-hover rounded-full border border-border bg-secondary px-4 py-2 text-[0.8125rem] font-medium text-foreground md:text-sm"
              >
                Ver el calendario
              </Link>
              <Link
                to="/guardados"
                className="glow-hover rounded-full border border-border bg-secondary px-4 py-2 text-[0.8125rem] font-medium text-foreground md:text-sm"
              >
                Mis guardados
              </Link>
              <Link
                to="/admin"
                className="glow-hover rounded-full border border-border bg-secondary px-4 py-2 text-[0.8125rem] font-medium text-foreground md:text-sm"
              >
                Publicar / Administración
              </Link>
            </div>
          </section>
        )}

        {tab === "fiestas" &&
          (savedPosts.length === 0 ? (
            <EmptyState
              title="Aún no has guardado ninguna fiesta"
              description="Las publicaciones guardadas no caducan y las tendrás siempre aquí."
            />
          ) : (
            <FeedGrid posts={savedPosts} />
          ))}

        {tab === "comentarios" &&
          (myComments.length === 0 ? (
            <EmptyState
              title="Todavía no has comentado"
              description="Entra en cualquier fiesta, valórala con estrellas y cuenta tu experiencia."
            />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {myComments.map((c) => (
                <li key={c.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-muted-foreground">
                    {c.posts ? (
                      <Link
                        to="/articulo/$slug"
                        params={{ slug: c.posts.slug }}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.posts.title}
                      </Link>
                    ) : (
                      <span>Publicación retirada</span>
                    )}
                    <time dateTime={c.created_at}>{formatDate(c.created_at)}</time>
                    {c.rating != null && <span className="text-primary">★ {c.rating}</span>}
                  </div>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed">{c.body}</p>
                </li>
              ))}
            </ul>
          ))}

        {tab === "publicaciones" &&
          (myPosts.length === 0 ? (
            <EmptyState
              title="No has publicado nada"
              description="Si tienes cuenta de suscriptor puedes crear publicaciones desde el panel."
            />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {myPosts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <Link
                      to="/articulo/$slug"
                      params={{ slug: p.slug }}
                      className="font-medium hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                      {categoryLabel(p.category)}
                      {p.event_date ? ` · ${formatDate(`${p.event_date}T12:00:00Z`)}` : ""}
                    </p>
                  </div>
                  <span className="eyebrow rounded-full border border-border px-3 py-1 text-muted-foreground">
                    {statusLabel(p.status)}
                  </span>
                </li>
              ))}
            </ul>
          ))}

        {tab === "conexiones" && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
              <Users className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-2xl font-bold">Amigos y conexiones</h2>
            <p className="mx-auto mt-3 max-w-md text-[0.9375rem] text-muted-foreground">
              Pronto podrás seguir a otros vecinos y ver a qué fiestas van. Por ahora, comparte las
              publicaciones que te interesen para invitar a quien quieras.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4">
      <dt className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1.5 text-2xl font-bold md:text-3xl">{value}</dd>
    </div>
  );
}
