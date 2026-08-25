import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { Errors } from "@/src/server/errors/app-error";

export class WatchlistService {
  async getDefault(userId: string) {
    const admin = createAdminSupabaseClient();
    const { data: watchlist, error } = await admin.from("watchlists").select("id, name, created_at, updated_at, watchlist_assets(symbol, created_at)").eq("user_id", userId).order("created_at").limit(1).maybeSingle();
    if (error) throw error;
    if (!watchlist) throw Errors.notFound("Watchlist");
    return watchlist;
  }

  async addAsset(userId: string, symbol: string) {
    const watchlist = await this.getDefault(userId);
    const { error } = await createAdminSupabaseClient().from("watchlist_assets").upsert({ watchlist_id: watchlist.id, symbol }, { onConflict: "watchlist_id,symbol", ignoreDuplicates: true });
    if (error) throw error;
    return this.getDefault(userId);
  }

  async removeAsset(userId: string, symbol: string) {
    const watchlist = await this.getDefault(userId);
    const { error } = await createAdminSupabaseClient().from("watchlist_assets").delete().eq("watchlist_id", watchlist.id).eq("symbol", symbol);
    if (error) throw error;
  }
}
