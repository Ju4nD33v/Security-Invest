import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { getServerEnv } from "@/src/server/config/env";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { forgotPasswordSchema } from "@/src/server/schemas/auth.schema";
import { assertSameOrigin, enforceRateLimit } from "@/src/server/security/request-security";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = forgotPasswordSchema.parse(await request.json());
    await enforceRateLimit(request, "auth:forgot-password", input.email, 3, 900);
    const supabase = await createServerSupabaseClient();
    await supabase.auth.resetPasswordForEmail(input.email, { redirectTo: `${getServerEnv().APP_URL}/reset-password` });
    return apiJson({ message: "Se houver uma conta para este e-mail, enviaremos instruções de recuperação." }, request);
  } catch (error) {
    return apiError(error, request);
  }
}
