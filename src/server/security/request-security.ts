import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { getServerEnv } from "@/src/server/config/env";
import { Errors } from "@/src/server/errors/app-error";

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function stableHash(value: string) {
  return createHmac("sha256", getServerEnv().SECURITY_HASH_SECRET).update(value.trim().toLowerCase()).digest("hex");
}

export async function enforceRateLimit(request: Request, scope: string, identity = "anonymous", maxRequests = 60, windowSeconds = 60) {
  const bucket = stableHash(`${scope}:${identity}:${clientIp(request)}`);
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_bucket_key: bucket,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  if (!data) throw Errors.rateLimited();
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expectedOrigin = new URL(getServerEnv().APP_URL).origin;
  if (origin !== expectedOrigin) throw Errors.forbidden();
}
