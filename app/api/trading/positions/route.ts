import { NextRequest } from "next/server";
import { requireUser } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { PaperTradingProvider } from "@/src/server/services/paper-trading.service";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest) { try { const user = await requireUser(); return apiJson({ simulation: true, positions: await new PaperTradingProvider().getPositions(user.userId) }, request); } catch (error) { return apiError(error, request); } }
