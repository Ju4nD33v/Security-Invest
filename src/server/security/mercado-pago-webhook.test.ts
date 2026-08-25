import { createHmac } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { verifyMercadoPagoWebhook } from "@/src/server/security/mercado-pago-webhook";

beforeAll(() => {
  process.env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public", SUPABASE_SECRET_KEY: "server", APP_URL: "http://localhost:3000", ALLOWED_ORIGINS: "http://localhost:3000", SECURITY_HASH_SECRET: "a".repeat(32), MERCADO_PAGO_WEBHOOK_SECRET: "webhook-secret" };
});

describe("Mercado Pago webhook signature", () => {
  it("accepts a valid signed payment event", () => {
    const id = "123456";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const requestId = "request-123";
    const template = `id:${id};request-id:${requestId};ts:${timestamp}`;
    const signature = createHmac("sha256", "webhook-secret").update(template).digest("hex");
    const request = new Request(`http://localhost/api/webhooks/mercadopago?data.id=${id}`, { headers: { "x-request-id": requestId, "x-signature": `ts=${timestamp},v1=${signature}` } });
    expect(verifyMercadoPagoWebhook(request, id)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const request = new Request("http://localhost/api/webhooks/mercadopago?data.id=123", { headers: { "x-signature": `ts=${timestamp},v1=${"0".repeat(64)}` } });
    expect(verifyMercadoPagoWebhook(request, "123")).toBe(false);
  });
});
