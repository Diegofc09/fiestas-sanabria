import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { adminSavePost, getAdminContext } from "@/lib/posts.functions";
import {
  CATEGORIES,
  daysUntilRemoval,
  eventPhase,
  eventPhaseLabel,
  slugify,
  type Post,
  type PostCategory,
  type PostStatus,
} from "@/lib/posts";
import { uploadPostImage } from "@/lib/upload";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: PostCategory;
  featured: boolean;
  status: PostStatus;
  event_date: string;
  event_end_date: string;
  village: string;
  cover_image_url: string | null;
  cover_image_alt: string;
};

const fieldClass =
  "h-11 w-full rounded-sm border border-input bg-paper px-3 text-base outline-none transition-colors focus:border-primary";

export function PostForm({ post }: { post?: Post }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const { data: ctx } = useQuery({
    queryKey: ["admin-context"],
    queryFn: () => getAdminContext(),
    staleTime: 60_000,
  });
  const isAdmin = Boolean(ctx?.isAdmin);

  const [form, setForm] = useState<FormState>({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    category: post?.category ?? "fiestas",
    featured: post?.featured ?? false,
    status: post?.status ?? "draft",
    event_date: post?.event_date ?? "",
    event_end_date: post?.event_end_date ?? "",
    village: post?.village ?? "",
    cover_image_url: post?.cover_image_url ?? null,
    cover_image_alt: post?.cover_image_alt ?? "",
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const eventDates = {
    event_date: form.event_date || null,
    event_end_date: form.event_end_date || null,
  };
  const phase = eventPhase(eventDates);
  const removalDays = daysUntilRemoval(eventDates);

  const save = useMutation({
    mutationFn: (status: PostStatus) =>
      adminSavePost({
        data: {
          ...(post ? { id: post.id } : {}),
          title: form.title.trim(),
          slug: (form.slug || slugify(form.title)).trim(),
          excerpt: form.excerpt.trim() || null,
          content: form.content,
          category: form.category,
          featured: form.featured,
          status,
          event_date: form.event_date ? form.event_date : null,
          event_end_date: form.event_end_date ? form.event_end_date : null,
          cover_image_url: form.cover_image_url,
          cover_image_alt: form.cover_image_alt.trim() || null,
          published_at: post?.published_at ?? null,
        },
      }),
    onSuccess: async (_data, status) => {
      toast.success(
        status === "published"
          ? "Publicación publicada."
          : status === "pending"
            ? "Enviada a revisión: la administración la revisará antes de publicarla."
            : "Borrador guardado.",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate({ to: "/admin" });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No se ha podido guardar la publicación."),
  });

  const submit = (status: PostStatus) => {
    if (form.title.trim().length < 3) {
      toast.error("El titular es obligatorio.");
      return;
    }
    if (form.content.replace(/<[^>]*>/g, "").trim().length === 0) {
      toast.error("El cuerpo del artículo está vacío.");
      return;
    }
    if (form.event_end_date && form.event_date && form.event_end_date < form.event_date) {
      toast.error("La fecha de fin no puede ser anterior al inicio.");
      return;
    }
    if (form.event_end_date && !form.event_date) {
      toast.error("Indica primero la fecha de inicio del evento.");
      return;
    }
    save.mutate(status);
  };

  const onCover = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPostImage(file);
      set("cover_image_url", url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se ha podido subir la imagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-5">
        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
            Titular
          </label>
          <input
            id="title"
            value={form.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugEdited) set("slug", slugify(e.target.value));
            }}
            className="h-14 w-full rounded-sm border border-input bg-paper px-3 font-[family-name:var(--font-display)] text-2xl outline-none transition-colors focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="mb-1.5 block text-sm font-medium">
            Entradilla
          </label>
          <textarea
            id="excerpt"
            rows={3}
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            className="w-full resize-y rounded-sm border border-input bg-paper px-3 py-2.5 font-[family-name:var(--font-serif)] text-base outline-none transition-colors focus:border-primary"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Cuerpo del artículo</span>
          <RichTextEditor value={form.content} onChange={(html) => set("content", html)} />
        </div>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-sm border border-rule bg-paper p-4">
          <p className="eyebrow text-muted-foreground">Publicación</p>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="category" className="mb-1.5 block text-sm font-medium">
                Sección
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => set("category", e.target.value as PostCategory)}
                className={fieldClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="slug" className="mb-1.5 block text-sm font-medium">
                URL
              </label>
              <input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  set("slug", slugify(e.target.value));
                }}
                className={fieldClass}
              />
              <p className="mt-1 truncate text-xs text-muted-foreground">/articulo/{form.slug || "…"}</p>
            </div>
            <div>
              <label htmlFor="event_date" className="mb-1.5 block text-sm font-medium">
                Inicio del evento
              </label>
              <input
                id="event_date"
                type="date"
                value={form.event_date}
                onChange={(e) => set("event_date", e.target.value)}
                className={fieldClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Opcional. Se usa en el calendario y en el artículo.
              </p>
            </div>
            <div>
              <label htmlFor="event_end_date" className="mb-1.5 block text-sm font-medium">
                Fin del evento
              </label>
              <input
                id="event_end_date"
                type="date"
                value={form.event_end_date}
                min={form.event_date || undefined}
                onChange={(e) => set("event_end_date", e.target.value)}
                className={fieldClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Si se deja vacío se usa la fecha de inicio. Estado: “Sin empezar”, “En curso” y
                “Terminada”; 14 días después del fin la publicación se elimina automáticamente.
              </p>
              {phase && (
                <p className="mt-2 text-xs font-medium text-foreground">
                  Estado actual: {eventPhaseLabel(phase)}
                  {phase === "finished" && removalDays !== null
                    ? removalDays > 0
                      ? ` · se eliminará en ${removalDays} día${removalDays === 1 ? "" : "s"}`
                      : " · pendiente de eliminación automática"
                    : ""}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Destacar en portada
            </label>
          </div>
        </div>

        <div className="rounded-sm border border-rule bg-paper p-4">
          <p className="eyebrow text-muted-foreground">Imagen principal</p>
          {form.cover_image_url ? (
            <div className="mt-3">
              <img
                src={form.cover_image_url}
                alt={form.cover_image_alt || "Imagen principal"}
                className="aspect-[4/3] w-full rounded-sm object-cover"
              />
              <button
                type="button"
                onClick={() => set("cover_image_url", null)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Quitar imagen
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-3 flex h-28 w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-rule text-sm text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              Subir imagen
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,image/*"
            className="hidden"
            onChange={(e) => void onCover(e.target.files?.[0])}
          />
          <label htmlFor="alt" className="mb-1.5 mt-4 block text-sm font-medium">
            Texto alternativo
          </label>
          <input
            id="alt"
            value={form.cover_image_alt}
            onChange={(e) => set("cover_image_alt", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => submit(isAdmin ? "published" : "pending")}
            disabled={save.isPending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-primary text-sm font-medium text-primary-foreground transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isAdmin
              ? form.status === "published"
                ? "Actualizar publicación"
                : "Publicar"
              : "Enviar a revisión"}
          </button>
          <button
            type="button"
            onClick={() => submit("draft")}
            disabled={save.isPending}
            className="inline-flex h-11 w-full items-center justify-center rounded-sm border border-input text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
          >
            Guardar como borrador
          </button>
          {!isAdmin && (
            <p className="pt-1 text-xs text-muted-foreground">
              Tu publicación quedará en revisión; un administrador la aprobará para publicarla.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
