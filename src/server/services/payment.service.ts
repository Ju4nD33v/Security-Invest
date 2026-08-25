import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { getServerEnv } from "@/src/server/config/env";
import { Errors } from "@/src/server/errors/app-error";
import { MercadoPagoProvider } from "@/src/server/integrations/mercado-pago.provider";

export class PaymentService {
  constructor(private readonly provider = new MercadoPagoProvider()) {}
  async listPlans() { const { data, error } = await createAdminSupabaseClient().from("plans").select("code, name, description, price, currency, billing_period").eq("active", true).order("price"); if (error) throw error; return data; }
  async createPix(userId: string, planCode: string, document: string, idempotencyKey: string) {
    const admin = createAdminSupabaseClient();
    const { data: existing } = await admin.from("payments").select("id, status, provider_order_id, provider_payload").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return existing;
    const [{ data: plan, error: planError }, { data: profile, error: profileError }] = await Promise.all([admin.from("plans").select("id, code, name, price, currency").eq("code", planCode).eq("active", true).maybeSingle(), admin.from("profiles").select("email").eq("id", userId).maybeSingle()]);
    if (planError || !plan) throw Errors.notFound("Plano");
    if (profileError || !profile?.email) throw Errors.unauthorized();
    if (plan.currency !== "BRL" || Number(plan.price) <= 0) throw Errors.conflict("UNSUPPORTED_PLAN", "Este plano não pode ser pago por Pix.");
    const { data: payment, error: paymentError } = await admin.from("payments").insert({ user_id: userId, plan_id: plan.id, provider: "MERCADO_PAGO", amount: plan.price, currency: plan.currency, idempotency_key: idempotencyKey }).select("id").single();
    if (paymentError || !payment) throw paymentError;
    try {
      const external = await this.provider.createPixPayment({ amount: Number(plan.price), description: `Secure Invest — ${plan.name}`, email: profile.email, document, idempotencyKey, notificationUrl: `${getServerEnv().APP_URL}/api/webhooks/mercadopago`, externalReference: payment.id });
      const transaction = external.point_of_interaction?.transaction_data;
      await admin.from("payments").update({ provider_order_id: String(external.id), provider_payload: external }).eq("id", payment.id);
      return { id: payment.id, status: external.status, pix: transaction ? { qrCode: transaction.qr_code, qrCodeBase64: transaction.qr_code_base64, ticketUrl: transaction.ticket_url } : null };
    } catch (error) { await admin.from("payments").update({ status: "REJECTED" }).eq("id", payment.id); throw error; }
  }
}
