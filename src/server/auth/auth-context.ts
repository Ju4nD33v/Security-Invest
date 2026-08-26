import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { Errors } from "@/src/server/errors/app-error";

export type AuthContext = {
  userId: string;
  email: string | null;
  role: "USER" | "ADMIN";
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
};

export async function requireUser(): Promise<AuthContext> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw Errors.unauthorized();

  const admin = createAdminSupabaseClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, account_status, first_name, last_name, full_name, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile) throw Errors.unauthorized();
  if (profile.account_status !== "ACTIVE") throw Errors.suspended();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: profile.role as AuthContext["role"],
    firstName: profile.first_name,
    lastName: profile.last_name,
    fullName: profile.full_name,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
  };
}

export async function requireAdmin() {
  const context = await requireUser();
  if (context.role !== "ADMIN") throw Errors.forbidden();
  return context;
}
