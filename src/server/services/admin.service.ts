import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { Errors } from "@/src/server/errors/app-error";

export class AdminService {
  private readonly admin = createAdminSupabaseClient();
  async dashboard() {
    const [users, activeUsers, suspendedUsers, accounts, orders, subscriptions, approvedPayments, pendingPayments, security, integrations] = await Promise.all([
      this.admin.from("profiles").select("id", { count: "exact", head: true }), this.admin.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "ACTIVE"), this.admin.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "SUSPENDED"), this.admin.from("paper_accounts").select("id", { count: "exact", head: true }), this.admin.from("paper_orders").select("id, quantity, execution_price", { count: "exact" }).eq("status", "FILLED"), this.admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"), this.admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "APPROVED"), this.admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "PENDING"), this.admin.from("security_events").select("id", { count: "exact", head: true }).in("severity", ["WARNING", "CRITICAL"]), this.admin.from("integration_health").select("provider, status, latency_ms, last_successful_request_at, last_error_at"),
    ]);
    const virtualVolume = (orders.data ?? []).reduce((sum, order) => sum + Number(order.quantity) * Number(order.execution_price ?? 0), 0);
    return { users: { total: users.count ?? 0, active: activeUsers.count ?? 0, suspended: suspendedUsers.count ?? 0 }, paperTrading: { accounts: accounts.count ?? 0, orders: orders.count ?? 0, virtualVolume }, subscriptions: subscriptions.count ?? 0, payments: { approved: approvedPayments.count ?? 0, pending: pendingPayments.count ?? 0 }, suspiciousLoginEvents: security.count ?? 0, integrations: integrations.data ?? [] };
  }
  async users(query: string | null) {
    let request = this.admin.from("profiles").select("id, full_name, email, role, account_status, created_at, last_login_at").order("created_at", { ascending: false }).limit(100);
    const safeQuery = query?.trim().replace(/[^a-zA-Z0-9@ _-]/g, "") ?? "";
    if (safeQuery) request = request.or(`full_name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%`);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }
  async setUserStatus(adminId: string, userId: string, accountStatus: "ACTIVE" | "SUSPENDED", requestId: string) {
    if (adminId === userId) throw Errors.conflict("SELF_ADMIN_ACTION", "Não é permitido suspender a própria conta administrativa.");
    const { error } = await this.admin.from("profiles").update({ account_status: accountStatus }).eq("id", userId);
    if (error) throw error;
    await this.admin.from("audit_logs").insert({ admin_id: adminId, action: accountStatus === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED", resource: "profiles", resource_id: userId, request_id: requestId, metadata: {} });
  }
}
