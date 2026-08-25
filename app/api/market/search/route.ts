import { NextRequest } from "next/server";
import { FmpProvider } from "@/src/server/integrations/fmp.provider";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { marketSearchSchema } from "@/src/server/schemas/market.schema";
import { enforceRateLimit } from "@/src/server/security/request-security";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest) {
  try {
    const input = marketSearchSchema.parse({ q: request.nextUrl.searchParams.get("q") });
    await enforceRateLimit(request, "market:search", input.q, 30, 60);
    return apiJson({ data: await new FmpProvider().search(input.q), source: "FMP" }, request);
  } catch (error) { return apiError(error, request); }
}
