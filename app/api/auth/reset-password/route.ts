import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { resetPasswordSchema } from "@/src/server/schemas/auth.schema";
import { assertSameOrigin, enforceRateLimit } from "@/src/server/security/request-security";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "auth:reset-password", "recovery", 5, 900);
    const input = resetPasswordSchema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) throw error;
    return apiJson({ success: true }, request);
  } catch (error) {
    return apiError(error, request);
  }
}
