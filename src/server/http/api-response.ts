import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAllowedOrigins } from "@/src/server/config/env";
import { AppError } from "@/src/server/errors/app-error";
import { logger } from "@/src/server/observability/logger";

export function requestId() {
  return crypto.randomUUID();
}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!origin || !getAllowedOrigins().includes(origin)) return headers;
  headers["Access-Control-Allow-Origin"] = origin;
  headers["Access-Control-Allow-Credentials"] = "true";
  headers["Access-Control-Allow-Headers"] = "Content-Type, X-Idempotency-Key, X-Request-Id";
  headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS";
  headers.Vary = "Origin";
  return headers;
}

export function apiJson(data: unknown, request: Request, status = 200, id = requestId()) {
  return NextResponse.json(data, { status, headers: { "X-Request-Id": id, ...corsHeaders(request.headers.get("origin")) } });
}

export function apiOptions(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export function apiError(error: unknown, request: Request, id = requestId()) {
  if (error instanceof ZodError) {
    return apiJson({ error: { code: "VALIDATION_ERROR", message: "Dados inválidos.", details: error.flatten() } }, request, 400, id);
  }
  if (error instanceof AppError) {
    return apiJson({ error: { code: error.code, message: error.message, details: error.details } }, request, error.status, id);
  }
  logger.error({ err: error, requestId: id, route: new URL(request.url).pathname, method: request.method, securityEvent: "UNHANDLED_ERROR" }, "Unhandled API error");
  return apiJson({ error: { code: "INTERNAL_ERROR", message: "Não foi possível concluir a solicitação." } }, request, 500, id);
}
