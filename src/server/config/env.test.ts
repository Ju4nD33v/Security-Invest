import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const secureEnv = {
  APP_URL: "https://security-invest.vercel.app",
  ALLOWED_ORIGINS: "https://security-invest.vercel.app",
  SECURITY_HASH_SECRET: "a-secure-test-value-with-at-least-32-characters",
  SUPABASE_SECRET_KEY: "server-only-test-key",
  NODE_ENV: "test",
};

describe("parseServerEnv", () => {
  it("accepts the legacy Supabase variable names and normalizes them", () => {
    const env = parseServerEnv({
      ...secureEnv,
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "publishable-test-key",
    });

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://project.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("publishable-test-key");
  });

  it("rejects an empty security hash secret", () => {
    expect(() => parseServerEnv({
      ...secureEnv,
      SECURITY_HASH_SECRET: "",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "publishable-test-key",
    })).toThrow();
  });

  it("treats blank optional provider credentials as unconfigured", () => {
    const env = parseServerEnv({
      ...secureEnv,
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "publishable-test-key",
      BRAPI_TOKEN: "",
      MERCADO_PAGO_ACCESS_TOKEN: "",
    });

    expect(env.BRAPI_TOKEN).toBeUndefined();
    expect(env.MERCADO_PAGO_ACCESS_TOKEN).toBeUndefined();
  });
});
