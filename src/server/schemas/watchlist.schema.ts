import { z } from "zod";

export const watchlistAssetSchema = z.object({
  symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,20}$/),
});
