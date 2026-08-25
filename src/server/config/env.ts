import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  APP_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().min(1),
  SECURITY_HASH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(30_000).default(8_000),
  PAPER_PRICE_MAX_AGE_SECONDS: z.coerce.number().int().min(1).max(300).default(60),
  FMP_API_KEY: z.string().min(1).optional(),
  FMP_BASE_URL: z.string().url().optional(),
  ALPHA_VANTAGE_API_KEY: z.string().min(1).optional(),
  ALPHA_VANTAGE_BASE_URL: z.string().url().optional(),
  MERCADO_PAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MERCADO_PAGO_PUBLIC_KEY: z.string().min(1).optional(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
}).refine((env) => Boolean(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY), {
  message: "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required.",
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!cachedEnv) {
    cachedEnv = serverEnvSchema.parse(process.env);
  }
  return cachedEnv;
}

export function getAllowedOrigins(): string[] {
  return getServerEnv().ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export function getSupabaseServerKey(): string {
  const env = getServerEnv();
  return env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY!;
}
