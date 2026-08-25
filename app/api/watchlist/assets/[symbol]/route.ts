import { NextRequest } from "next/server";
import { requireUser } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { watchlistAssetSchema } from "@/src/server/schemas/watchlist.schema";
import { WatchlistService } from "@/src/server/services/watchlist.service";
import { assertSameOrigin } from "@/src/server/security/request-security";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function DELETE(request: NextRequest, context: { params: Promise<{ symbol: string }> }) { try { assertSameOrigin(request); const user = await requireUser(); const { symbol } = watchlistAssetSchema.parse(await context.params); await new WatchlistService().removeAsset(user.userId, symbol); return apiJson({ success: true }, request); } catch (error) { return apiError(error, request); } }
