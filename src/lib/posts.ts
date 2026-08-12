export type PostCategory = "fiestas" | "eventos" | "noticias" | "otros";
export type PostStatus = "draft" | "pending" | "published";
export type AppRole = "admin" | "editor" | "subscriber";

export function statusLabel(status: PostStatus): string {
  if (status === "published") return "Publicado";
  if (status === "pending") return "En revisión";
  return "Borrador";
}


export type Post = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  excerpt: string | null;
  content: string;
  category: PostCategory;
  featured: boolean;
  status: PostStatus;
  event_date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PostSummary = Omit<Post, "content">;

export const CATEGORIES: { value: PostCategory; label: string; path: string }[] = [
  { value: "fiestas", label: "Fiestas", path: "/fiestas" },
  { value: "eventos", label: "Eventos", path: "/eventos" },
  { value: "noticias", label: "Noticias", path: "/noticias" },
  { value: "otros", label: "Otros", path: "/otros" },
];

export function categoryLabel(value: PostCategory): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Otros";
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

/** Fecha del evento si existe, si no la de publicación. */
export function timelineDate(post: { event_date?: string | null; published_at?: string | null; created_at?: string }): string {
  return post.event_date ? `${post.event_date}T12:00:00Z` : (post.published_at ?? post.created_at ?? "");
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingMinutes(html: string): number {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
