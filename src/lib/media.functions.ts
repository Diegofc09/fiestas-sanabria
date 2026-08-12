import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_BYTES = 8 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

/** Sube una imagen al bucket privado usando credenciales de servidor (evita problemas de permisos). */
export const uploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Formato de subida no válido.");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("No se ha recibido ningún archivo.");
    return { file };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Solo la administración puede subir imágenes.");

    const { file } = data;
    if (file.size === 0) throw new Error("El archivo está vacío.");
    if (file.size > MAX_BYTES) throw new Error("La imagen no puede superar los 8 MB.");

    const nameExtension = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const type = file.type?.toLowerCase() ?? "";
    const extension = EXTENSIONS[type] ?? (nameExtension || "jpg");
    const allowed = new Set([...Object.values(EXTENSIONS), "jpeg"]);
    if (!allowed.has(extension)) {
      throw new Error("Formato no admitido. Usa PNG, JPG, WEBP, GIF, AVIF o SVG.");
    }

    const contentType = type.startsWith("image/")
      ? type
      : extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : extension === "gif"
            ? "image/gif"
            : extension === "avif"
              ? "image/avif"
              : extension === "svg"
                ? "image/svg+xml"
                : "image/jpeg";

    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${extension === "jpeg" ? "jpg" : extension}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from("post-images").upload(path, bytes, {
      cacheControl: "31536000",
      contentType,
      upsert: false,
    });
    if (error) throw new Error(error.message);

    return { url: `/api/public/media/${path}` };
  });
