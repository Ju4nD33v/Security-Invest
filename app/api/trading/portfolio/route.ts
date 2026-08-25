import { NextRequest } from "next/server";
import { requireUser } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { PortfolioService } from "@/src/server/services/portfolio.service";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest) { try { const user = await requireUser(); return apiJson(await new PortfolioService().getPortfolio(user.userId), request); } catch (error) { return apiError(error, request); } }
