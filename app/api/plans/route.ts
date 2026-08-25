import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { PaymentService } from "@/src/server/services/payment.service";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest) { try { return apiJson({ plans: await new PaymentService().listPlans() }, request); } catch (error) { return apiError(error, request); } }
