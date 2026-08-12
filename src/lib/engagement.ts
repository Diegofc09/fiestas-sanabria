import { z } from "zod";

import { PROFANITY_MESSAGE, containsProfanity } from "./profanity";

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

/** Máximo de enlaces permitidos en un comentario (anti spam). */
const MAX_LINKS = 1;

export function countLinks(text: string): number {
  return (text.match(/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ru|xyz|top|info|biz)\b/gi) ?? [])
    .length;
}

export const commentSchema = z.object({
  postId: z.string().uuid(),
  authorName: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre")
    .max(60)
    .refine((v) => !containsProfanity(v), "Usa un nombre sin palabras ofensivas"),
  body: z
    .string()
    .trim()
    .min(2, "Escribe un comentario")
    .max(2000)
    .refine((v) => countLinks(v) <= MAX_LINKS, "Demasiados enlaces en el comentario")
    .refine((v) => !containsProfanity(v), PROFANITY_MESSAGE),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  visitorToken: z.string().trim().max(100).optional(),
  /** Campo trampa: sólo lo rellenan los bots. */
  honeypot: z.string().max(0, "Envío no válido").optional(),
});

/** Espera mínima entre comentarios del mismo navegador (ms). */
export const COMMENT_COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = "fs-comment-last";

/** Segundos que faltan para poder comentar de nuevo. */
export function commentCooldownLeft(): number {
  if (typeof window === "undefined") return 0;
  const last = Number(window.localStorage.getItem(COOLDOWN_KEY) ?? 0);
  if (!last) return 0;
  return Math.max(0, Math.ceil((COMMENT_COOLDOWN_MS - (Date.now() - last)) / 1000));
}

export function markCommentSent(): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  }
}


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
