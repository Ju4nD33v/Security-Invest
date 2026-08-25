import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { FmpProvider } from "@/src/server/integrations/fmp.provider";
import { symbolParamsSchema } from "@/src/server/schemas/market.schema";
import { enforceRateLimit } from "@/src/server/security/request-security";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = symbolParamsSchema.parse(await context.params);
    await enforceRateLimit(request, "market:profile", symbol, 30, 60);
    return apiJson({ data: await new FmpProvider().profile(symbol), source: "FMP", retrievedAt: new Date().toISOString() }, request);
  } catch (error) { return apiError(error, request); }
}
