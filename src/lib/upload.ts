import { uploadImage } from "@/lib/media.functions";

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "avif", "svg"];

/** Sube una imagen y devuelve la URL servida por la app. */
export async function uploadPostImage(file: File): Promise<string> {
  const extension = (file.name.split(".").pop() ?? "").toLowerCase();
  const looksLikeImage = file.type.startsWith("image/") || ALLOWED_EXTENSIONS.includes(extension);
  if (!looksLikeImage) {
    throw new Error("El archivo debe ser una imagen (PNG, JPG, WEBP, GIF, AVIF o SVG).");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("La imagen no puede superar los 8 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const result = await uploadImage({ data: formData });
  return result.url;
}
