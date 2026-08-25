import { NextRequest } from "next/server";
import { requireUser } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { orderIdParamsSchema } from "@/src/server/schemas/trading.schema";
import { PaperTradingProvider } from "@/src/server/services/paper-trading.service";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) { try { const user = await requireUser(); const { id } = orderIdParamsSchema.parse(await context.params); return apiJson({ simulation: true, order: await new PaperTradingProvider().getOrder(user.userId, id) }, request); } catch (error) { return apiError(error, request); } }
