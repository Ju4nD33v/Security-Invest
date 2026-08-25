import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { Errors } from "@/src/server/errors/app-error";

export type AuthContext = {
  userId: string;
  email: string | null;
  role: "USER" | "ADMIN";
};

export async function requireUser(): Promise<AuthContext> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw Errors.unauthorized();

  const admin = createAdminSupabaseClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, account_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile) throw Errors.unauthorized();
  if (profile.account_status !== "ACTIVE") throw Errors.suspended();

  return { userId: user.id, email: user.email ?? null, role: profile.role as AuthContext["role"] };
}

export async function requireAdmin() {
  const context = await requireUser();
  if (context.role !== "ADMIN") throw Errors.forbidden();
  return context;
}
