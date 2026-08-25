import { createHmac, timingSafeEqual } from "crypto";
import { getServerEnv } from "@/src/server/config/env";

export function verifyMercadoPagoWebhook(request: Request, paymentId: string) {
  const secret = getServerEnv().MERCADO_PAGO_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!secret || !signature) return false;
  const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
  if (!parts.ts || !parts.v1) return false;
  const timestamp = Number(parts.ts);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp * 1000) > 300_000) return false;
  const normalizedId = /^[a-z0-9]+$/i.test(paymentId) ? paymentId.toLowerCase() : paymentId;
  const template = [`id:${normalizedId}`, requestId ? `request-id:${requestId}` : "", `ts:${parts.ts}`].filter(Boolean).join(";");
  const expected = createHmac("sha256", secret).update(template).digest("hex");
  const received = Buffer.from(parts.v1, "hex");
  const calculated = Buffer.from(expected, "hex");
  return received.length === calculated.length && timingSafeEqual(received, calculated);
}
