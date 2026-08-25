import { NextRequest } from "next/server";
import { requireUser } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { WatchlistService } from "@/src/server/services/watchlist.service";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest) { try { const user = await requireUser(); return apiJson({ watchlist: await new WatchlistService().getDefault(user.userId) }, request); } catch (error) { return apiError(error, request); } }
