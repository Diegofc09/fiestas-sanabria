import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}

async function assertAdmin(supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => Promise<{ data: unknown }> }, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Solo la administración puede gestionar códigos.");
}

/** Genera un código de invitación de suscriptor. */
export const adminCreateInviteCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        note: z.string().max(160).nullable().optional(),
        expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const expires_at = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 86400000).toISOString()
      : null;
    const { data: created, error } = await context.supabase
      .from("invite_codes")
      .insert({
        code: generateCode(),
        role: "subscriber",
        note: data.note?.trim() || null,
        created_by: context.userId,
        expires_at,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const adminListInviteCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminDeleteInviteCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("invite_codes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Canjea un código: convierte al usuario autenticado en suscriptor. */
export const redeemInviteCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().min(4).max(60) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const code = data.code.trim().toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invite, error } = await supabaseAdmin
      .from("invite_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invite) throw new Error("El código no es válido.");
    if (invite.used_at) throw new Error("Este código ya se ha utilizado.");
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error("Este código ha caducado.");
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: invite.role }, { onConflict: "user_id,role" });
    if (roleError) throw new Error(roleError.message);

    const { error: markError } = await supabaseAdmin
      .from("invite_codes")
      .update({ used_by: context.userId, used_at: new Date().toISOString() })
      .eq("id", invite.id)
      .is("used_at", null);
    if (markError) throw new Error(markError.message);

    return { ok: true, role: invite.role };
  });
