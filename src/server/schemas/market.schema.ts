import { z } from "zod";
import { MARKET_HISTORY_PERIODS } from "@/src/shared/market-history";

export const symbolParamsSchema = z.object({ symbol: z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,20}$/) });
export const marketSearchSchema = z.object({ q: z.string().trim().min(1).max(80) });
export const marketHistoryQuerySchema = z.object({
  period: z.enum(MARKET_HISTORY_PERIODS).default("1mo"),
});
