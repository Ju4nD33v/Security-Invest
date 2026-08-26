import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { Errors } from "@/src/server/errors/app-error";
import { MarketQuoteProvider } from "@/src/server/integrations/market-quote.provider";
import type { z } from "zod";
import type { createOrderSchema } from "@/src/server/schemas/trading.schema";

type CreateOrder = z.infer<typeof createOrderSchema>;

export class PaperTradingProvider {
  constructor(private readonly market = new MarketQuoteProvider()) {}

  async getAccount(userId: string) {
    const { data, error } = await createAdminSupabaseClient().from("paper_accounts").select("id, currency, initial_balance, cash_balance, reserved_balance, created_at, updated_at").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) throw Errors.notFound("Conta de Paper Trading");
    return data;
  }

  async getPositions(userId: string) {
    const { data, error } = await createAdminSupabaseClient().from("paper_positions").select("id, symbol, quantity, average_price, realized_pnl, updated_at").eq("user_id", userId).gt("quantity", 0).order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async getOrders(userId: string) {
    const { data, error } = await createAdminSupabaseClient().from("paper_orders").select("id, symbol, side, order_type, quantity, execution_price, currency, status, rejection_reason, created_at, executed_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data;
  }

  async getOrder(userId: string, orderId: string) {
    const { data, error } = await createAdminSupabaseClient().from("paper_orders").select("id, symbol, side, order_type, quantity, requested_price, execution_price, currency, status, rejection_reason, created_at, executed_at, cancelled_at").eq("user_id", userId).eq("id", orderId).maybeSingle();
    if (error) throw error;
    if (!data) throw Errors.notFound("Ordem");
    return data;
  }

  async getHistory(userId: string) {
    const { data, error } = await createAdminSupabaseClient().from("paper_transactions").select("id, order_id, symbol, side, quantity, unit_price, gross_amount, currency, realized_pnl, cash_balance_after, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data;
  }

  async createOrder(userId: string, order: CreateOrder, idempotencyKey: string) {
    const [account, quote] = await Promise.all([this.getAccount(userId), this.market.quote(order.symbol, true)]);
    if (account.currency !== quote.currency) throw Errors.conflict("CURRENCY_MISMATCH", "A moeda da cotação não é compatível com a conta simulada.");
    const { data, error } = await createAdminSupabaseClient().rpc("execute_paper_market_order", {
      p_user_id: userId, p_symbol: quote.symbol, p_side: order.side, p_quantity: order.quantity, p_execution_price: quote.price, p_currency: quote.currency, p_idempotency_key: idempotencyKey,
    });
    if (error) throw error;
    return { order: data, quote: { price: quote.price, currency: quote.currency, source: quote.source, retrievedAt: quote.retrievedAt } };
  }
}
