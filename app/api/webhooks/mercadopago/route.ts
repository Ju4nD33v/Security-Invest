import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { MercadoPagoProvider } from "@/src/server/integrations/mercado-pago.provider";
import { verifyMercadoPagoWebhook } from "@/src/server/security/mercado-pago-webhook";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get("data.id") ?? "";
  if (!paymentId || !verifyMercadoPagoWebhook(request, paymentId)) return new NextResponse(null, { status: 401 });
  const body: unknown = await request.json().catch(() => ({}));
  const admin = createAdminSupabaseClient();
  const { data: event, error: eventError } = await admin.from("webhook_events").upsert({ provider: "MERCADO_PAGO", provider_event_id: paymentId, event_type: "payment", payload: body }, { onConflict: "provider,provider_event_id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (eventError) return new NextResponse(null, { status: 500 });
  if (!event) return new NextResponse(null, { status: 200 });
  try {
    const external = await new MercadoPagoProvider().getPayment(paymentId);
    const { data: payment } = await admin.from("payments").select("id, amount, currency, provider_order_id").eq("provider_order_id", String(external.id)).maybeSingle();
    if (!payment || external.status !== "approved" || external.external_reference !== payment.id || external.currency_id !== payment.currency || external.transaction_amount !== Number(payment.amount)) throw new Error("Payment verification failed");
    const { error } = await admin.rpc("activate_subscription_from_payment", { p_payment_id: payment.id, p_paid_at: new Date().toISOString() });
    if (error) throw error;
    await admin.from("webhook_events").update({ status: "PROCESSED", processed_at: new Date().toISOString() }).eq("id", event.id);
    return new NextResponse(null, { status: 200 });
  } catch {
    await admin.from("webhook_events").update({ status: "FAILED" }).eq("id", event.id);
    return new NextResponse(null, { status: 500 });
  }
}
