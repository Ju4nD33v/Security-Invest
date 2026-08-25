import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/src/server/schemas/auth.schema";

describe("authentication input validation", () => {
  it("normalizes the email and only keeps permitted registration fields", () => {
    const input = signUpSchema.parse({
      fullName: "  Ana Investidora ",
      email: " ANA@EXAMPLE.COM ",
      password: "a-secure-password",
      role: "ADMIN",
    });

    expect(input).toEqual({ fullName: "Ana Investidora", email: "ana@example.com", password: "a-secure-password" });
  });

  it("rejects weak passwords, invalid emails and oversized login payloads", () => {
    expect(signUpSchema.safeParse({ fullName: "A", email: "not-an-email", password: "short" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "user@example.com", password: "x".repeat(129) }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "unsafe" }).success).toBe(false);
  });

  it("keeps password recovery response-neutral while validating the supplied email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "person@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "<script>alert(1)</script>" }).success).toBe(false);
  });
});
