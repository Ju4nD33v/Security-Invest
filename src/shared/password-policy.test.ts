import { describe, expect, it } from "vitest";
import { getPasswordValidationErrors, isPasswordValid, PASSWORD_MESSAGES } from "@/src/shared/password-policy";

describe("password policy", () => {
  it("accepts a password that meets every rule", () => {
    expect(isPasswordValid("Senha@1")).toBe(true);
    expect(getPasswordValidationErrors("Senha@1")).toEqual([]);
  });

  it.each([
    ["Ab@1", PASSWORD_MESSAGES.minLength],
    ["SenhaMuitoLonga@1", PASSWORD_MESSAGES.maxLength],
    ["senha@1", PASSWORD_MESSAGES.uppercase],
    ["Senha@x", PASSWORD_MESSAGES.number],
    ["Senha12", PASSWORD_MESSAGES.specialCharacter],
  ])("rejects %s with the expected message", (password, message) => {
    expect(getPasswordValidationErrors(password)).toContain(message);
  });

  it("reports every unmet rule instead of a generic error", () => {
    expect(getPasswordValidationErrors("abc")).toEqual([
      PASSWORD_MESSAGES.minLength,
      PASSWORD_MESSAGES.uppercase,
      PASSWORD_MESSAGES.number,
      PASSWORD_MESSAGES.specialCharacter,
    ]);
  });
});
