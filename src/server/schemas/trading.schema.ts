import { z } from "zod";

export const createOrderSchema = z.object({
  symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,20}$/),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.coerce.number().positive().max(1_000_000),
  orderType: z.literal("MARKET"),
});

export const orderIdParamsSchema = z.object({ id: z.string().uuid() });
