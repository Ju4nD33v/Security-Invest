import { NextRequest } from "next/server";
import { requireUser } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { watchlistAssetSchema } from "@/src/server/schemas/watchlist.schema";
import { WatchlistService } from "@/src/server/services/watchlist.service";
import { assertSameOrigin, enforceRateLimit } from "@/src/server/security/request-security";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function POST(request: NextRequest) { try { assertSameOrigin(request); const user = await requireUser(); await enforceRateLimit(request, "watchlist:write", user.userId, 30, 60); const { symbol } = watchlistAssetSchema.parse(await request.json()); return apiJson({ watchlist: await new WatchlistService().addAsset(user.userId, symbol) }, request, 201); } catch (error) { return apiError(error, request); } }
