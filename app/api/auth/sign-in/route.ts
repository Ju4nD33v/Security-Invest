import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { Errors } from "@/src/server/errors/app-error";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { signInSchema } from "@/src/server/schemas/auth.schema";
import { assertSameOrigin, clientIp, enforceRateLimit, stableHash } from "@/src/server/security/request-security";

export const runtime = "nodejs";

export function OPTIONS(request: Request) { return apiOptions(request); }

export async function POST(request: NextRequest) {
  let emailHash: string | undefined;
  try {
    assertSameOrigin(request);
    const input = signInSchema.parse(await request.json());
    emailHash = stableHash(input.email);
    await enforceRateLimit(request, "auth:sign-in", input.email, 5, 900);
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
    if (error || !data.user) throw Errors.unauthorized();

    const admin = createAdminSupabaseClient();
    const { data: profile } = await admin.from("profiles").select("account_status").eq("id", data.user.id).maybeSingle();
    if (!profile || profile.account_status !== "ACTIVE") {
      await supabase.auth.signOut();
      throw Errors.suspended();
    }
    await admin.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", data.user.id);
    await admin.from("login_attempts").insert({ email_hash: emailHash, ip_hash: stableHash(clientIp(request)), successful: true });
    return apiJson({ user: { id: data.user.id, email: data.user.email } }, request);
  } catch (error) {
    if (emailHash) {
      await createAdminSupabaseClient().from("login_attempts").insert({ email_hash: emailHash, ip_hash: stableHash(clientIp(request)), successful: false });
    }
    return apiError(error, request);
  }
}
