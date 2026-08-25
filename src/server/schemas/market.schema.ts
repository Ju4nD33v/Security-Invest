import { z } from "zod";

export const symbolParamsSchema = z.object({ symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,20}$/) });
export const marketSearchSchema = z.object({ q: z.string().trim().min(1).max(80) });
