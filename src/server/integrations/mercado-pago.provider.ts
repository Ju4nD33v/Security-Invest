import { z } from "zod";
import { getServerEnv } from "@/src/server/config/env";
import { Errors } from "@/src/server/errors/app-error";

const paymentSchema = z.object({ id: z.union([z.string(), z.number()]), status: z.string(), transaction_amount: z.coerce.number().optional(), currency_id: z.string().optional(), external_reference: z.string().optional(), point_of_interaction: z.object({ transaction_data: z.object({ qr_code: z.string().optional(), qr_code_base64: z.string().optional(), ticket_url: z.string().url().optional() }).optional() }).optional() }).passthrough();

export class MercadoPagoProvider {
  async createPixPayment(input: { amount: number; description: string; email: string; document: string; idempotencyKey: string; notificationUrl: string; externalReference: string }) {
    const env = getServerEnv();
    if (!env.MERCADO_PAGO_ACCESS_TOKEN) throw Errors.marketDataUnavailable();
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`, "Content-Type": "application/json", "X-Idempotency-Key": input.idempotencyKey },
      body: JSON.stringify({ transaction_amount: input.amount, description: input.description, external_reference: input.externalReference, payment_method_id: "pix", payer: { email: input.email, identification: { type: "CPF", number: input.document } }, notification_url: input.notificationUrl }),
      cache: "no-store",
    });
    if (!response.ok) throw Errors.marketDataUnavailable();
    return paymentSchema.parse(await response.json());
  }

  async getPayment(paymentId: string) {
    const env = getServerEnv();
    if (!env.MERCADO_PAGO_ACCESS_TOKEN) throw Errors.marketDataUnavailable();
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}` }, cache: "no-store" });
    if (!response.ok) throw Errors.marketDataUnavailable();
    return paymentSchema.parse(await response.json());
  }
}
