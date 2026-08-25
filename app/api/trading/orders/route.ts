import { NextRequest } from "next/server";
import { requireUser } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { createOrderSchema } from "@/src/server/schemas/trading.schema";
import { PaperTradingProvider } from "@/src/server/services/paper-trading.service";
import { assertSameOrigin, enforceRateLimit } from "@/src/server/security/request-security";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest) { try { const user = await requireUser(); return apiJson({ simulation: true, orders: await new PaperTradingProvider().getOrders(user.userId) }, request); } catch (error) { return apiError(error, request); } }
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    await enforceRateLimit(request, "trading:orders", user.userId, 10, 60);
    const input = createOrderSchema.parse(await request.json());
    const idempotencyKey = request.headers.get("x-idempotency-key");
    if (!idempotencyKey || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(idempotencyKey)) return apiJson({ error: { code: "VALIDATION_ERROR", message: "X-Idempotency-Key deve ser um UUID." } }, request, 400);
    const result = await new PaperTradingProvider().createOrder(user.userId, input, idempotencyKey);
    return apiJson({ simulation: true, ...result }, request, 201);
  } catch (error) { return apiError(error, request); }
}
