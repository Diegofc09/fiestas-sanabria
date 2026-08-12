import { z } from "zod";

export type PostComment = {
  id: string;
  post_id: string;
  author_name: string;
  body: string;
  rating: number | null;
  created_at: string;
};

export type AdminComment = PostComment & {
  approved: boolean;
  posts: { title: string; slug: string } | null;
};

export type Engagement = {
  post_id: string;
  comments_count: number;
  rating_avg: number | null;
  rating_count: number;
  attendance_count: number;
};

export const commentSchema = z.object({
  postId: z.string().uuid(),
  authorName: z.string().trim().min(2, "Escribe tu nombre").max(60),
  body: z.string().trim().min(2, "Escribe un comentario").max(2000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export const attendanceSchema = z.object({
  postId: z.string().uuid(),
  visitorToken: z.string().trim().min(10).max(100),
  attending: z.boolean(),
});

/** Categorías con puntuación y contador de asistencia. */
export function supportsEvent(category: string): boolean {
  return category === "fiestas" || category === "eventos";
}

export function formatRating(value: number | null | undefined): string {
  if (value == null) return "";
  return value.toFixed(1).replace(".", ",");
}

const TOKEN_KEY = "fs-visitor-token";

/** Identificador anónimo por navegador para no contar dos veces la misma asistencia. */
export function getVisitorToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(TOKEN_KEY);
  if (!token || token.length < 10) {
    token = crypto.randomUUID();
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}
