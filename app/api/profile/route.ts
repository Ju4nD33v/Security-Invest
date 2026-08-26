import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { requireUser } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { updateProfileSchema } from "@/src/server/schemas/auth.schema";
import { assertSameOrigin } from "@/src/server/security/request-security";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }

export async function GET(request: NextRequest) {
  try { return apiJson({ user: await requireUser() }, request); } catch (error) { return apiError(error, request); }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = updateProfileSchema.parse(await request.json());
    const fullName = `${input.firstName} ${input.lastName}`;
    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("profiles").update({
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: fullName,
      phone: input.phone ?? null,
    }).eq("id", user.userId);
    if (error) throw error;
    await admin.auth.admin.updateUserById(user.userId, { user_metadata: { first_name: input.firstName, last_name: input.lastName, full_name: fullName, phone: input.phone ?? null } });
    return apiJson({ user: await requireUser() }, request);
  } catch (error) { return apiError(error, request); }
}
