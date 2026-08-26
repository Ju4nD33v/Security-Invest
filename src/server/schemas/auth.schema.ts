import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(12).max(128);

export const signUpSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email,
  password,
  phone: z.string().trim().min(8).max(30).optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(30).optional().nullable(),
});

export const signInSchema = z.object({ email, password: z.string().min(1).max(128) });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ password });
