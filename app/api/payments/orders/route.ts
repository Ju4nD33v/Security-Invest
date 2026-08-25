import { NextRequest } from "next/server";
import { requireUser } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { createPaymentSchema } from "@/src/server/schemas/payment.schema";
import { PaymentService } from "@/src/server/services/payment.service";
import { assertSameOrigin, enforceRateLimit } from "@/src/server/security/request-security";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function POST(request: NextRequest) { try { assertSameOrigin(request); const user = await requireUser(); await enforceRateLimit(request, "payments:orders", user.userId, 5, 300); const input = createPaymentSchema.parse(await request.json()); const key = request.headers.get("x-idempotency-key"); if (!key || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(key)) return apiJson({ error: { code: "VALIDATION_ERROR", message: "X-Idempotency-Key deve ser um UUID." } }, request, 400); return apiJson(await new PaymentService().createPix(user.userId, input.planCode, input.payerDocument, key), request, 201); } catch (error) { return apiError(error, request); } }
