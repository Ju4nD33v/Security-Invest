import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { MarketHighlightsService } from "@/src/server/services/market-highlights.service";
import { enforceRateLimit } from "@/src/server/security/request-security";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "market:highlights", "b3", 30, 60);
    return apiJson(await new MarketHighlightsService().getB3Highlights(), request);
  } catch (error) { return apiError(error, request); }
}
