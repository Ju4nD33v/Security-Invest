import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { getServerEnv } from "@/src/server/config/env";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { signUpSchema } from "@/src/server/schemas/auth.schema";
import { assertSameOrigin, enforceRateLimit } from "@/src/server/security/request-security";

export const runtime = "nodejs";

export function OPTIONS(request: Request) { return apiOptions(request); }

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = signUpSchema.parse(await request.json());
    await enforceRateLimit(request, "auth:sign-up", input.email, 5, 900);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.fullName, phone: input.phone },
        emailRedirectTo: `${getServerEnv().APP_URL}/auth/callback`,
      },
    });
    if (error) throw error;
    return apiJson({ message: "Se o cadastro puder ser concluído, enviaremos as próximas instruções para seu e-mail." }, request, 201);
  } catch (error) {
    return apiError(error, request);
  }
}
