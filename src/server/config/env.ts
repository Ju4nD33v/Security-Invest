import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  // Legacy aliases kept server-side to make existing deployments configurable
  // without ever exposing a secret to the browser.
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
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
}).superRefine((env, context) => {
  if (!env.NEXT_PUBLIC_SUPABASE_URL && !env.SUPABASE_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["NEXT_PUBLIC_SUPABASE_URL"],
      message: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is required.",
    });
  }
  if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !env.SUPABASE_PUBLISHABLE_KEY) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
      message: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or SUPABASE_PUBLISHABLE_KEY is required.",
    });
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SECRET_KEY) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["SUPABASE_SECRET_KEY"],
      message: "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required.",
    });
  }
}).transform((env) => ({
  ...env,
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY!,
}));

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function parseServerEnv(env: Record<string, string | undefined>): ServerEnv {
  return serverEnvSchema.parse(env);
}

export function getServerEnv(): ServerEnv {
  if (!cachedEnv) {
    cachedEnv = parseServerEnv(process.env);
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
