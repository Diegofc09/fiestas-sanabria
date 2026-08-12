import { supabase } from "@/integrations/supabase/client";

const BUCKET = "post-images";

/** Sube una imagen al almacenamiento privado y devuelve la URL pública servida por la app. */
export async function uploadPostImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("La imagen no puede superar los 8 MB.");
  }

  const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension || "jpg"}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return `/api/public/media/${path}`;
}
