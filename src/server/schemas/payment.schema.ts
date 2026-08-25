import { z } from "zod";

export const createPaymentSchema = z.object({
  planCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]{2,30}$/),
  payerDocument: z.string().trim().regex(/^\d{11}$/),
});
