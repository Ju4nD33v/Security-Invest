import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { assertSameOrigin } from "@/src/server/security/request-security";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
    return apiJson({ success: true }, request);
  } catch (error) {
    return apiError(error, request);
  }
}
