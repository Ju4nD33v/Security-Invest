import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { symbolParamsSchema } from "@/src/server/schemas/market.schema";
import { InsightService } from "@/src/server/services/insight.service";
import { enforceRateLimit } from "@/src/server/security/request-security";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  try { const { symbol } = symbolParamsSchema.parse(await context.params); await enforceRateLimit(request, "insights", symbol, 6, 60); return apiJson(await new InsightService().generate(symbol), request); }
  catch (error) { return apiError(error, request); }
}
