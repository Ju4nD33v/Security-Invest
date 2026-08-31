import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { BrapiProvider } from "@/src/server/integrations/brapi.provider";
import { marketHistoryQuerySchema, symbolParamsSchema } from "@/src/server/schemas/market.schema";
import { enforceRateLimit } from "@/src/server/security/request-security";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = symbolParamsSchema.parse(await context.params);
    const { period } = marketHistoryQuerySchema.parse({ period: request.nextUrl.searchParams.get("period") ?? undefined });
    await enforceRateLimit(request, "market:history", `${symbol}:${period}`, 30, 60);
    return apiJson(await new BrapiProvider().getHistoricalPrices(symbol, period), request);
  } catch (error) { return apiError(error, request); }
}
