import { z } from "zod";
import { cached } from "@/src/server/cache/ttl-cache";
import { getServerEnv } from "@/src/server/config/env";
import { Errors } from "@/src/server/errors/app-error";
import { getExternalJson } from "@/src/server/integrations/http-client";

const recordArray = z.array(z.record(z.unknown()));
const symbolSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,20}$/);
function numberOf(value: unknown) { return typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : undefined; }
function stringOf(value: unknown) { return typeof value === "string" ? value : undefined; }

export type MarketQuote = { symbol: string; price: number; currency: string; change: number | undefined; changesPercentage: number | undefined; name: string | undefined; retrievedAt: string; source: "FMP" };

export class FmpProvider {
  private readonly env = getServerEnv();
  private readonly baseUrl = this.env.FMP_BASE_URL ?? "https://financialmodelingprep.com";

  private async request(path: string, params: Record<string, string>, ttlMs: number, bypassCache = false) {
    if (!this.env.FMP_API_KEY) throw Errors.marketDataUnavailable();
    const url = new URL(path, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const loader = () => getExternalJson(url, recordArray, { apikey: this.env.FMP_API_KEY! });
    return bypassCache ? loader() : cached(`fmp:${url.pathname}:${url.searchParams.toString()}`, ttlMs, loader);
  }

  async search(query: string) { return this.request("/stable/search-symbol", { query, limit: "20" }, 60_000); }
  async profile(symbol: string) { return this.request("/stable/profile", { symbol: symbolSchema.parse(symbol) }, 86_400_000); }
  async history(symbol: string) { return this.request("/stable/historical-price-eod/full", { symbol: symbolSchema.parse(symbol) }, 300_000); }
  async incomeStatement(symbol: string) { return this.request("/stable/income-statement", { symbol: symbolSchema.parse(symbol), limit: "5" }, 21_600_000); }
  async balanceSheet(symbol: string) { return this.request("/stable/balance-sheet-statement", { symbol: symbolSchema.parse(symbol), limit: "5" }, 21_600_000); }
  async cashFlow(symbol: string) { return this.request("/stable/cash-flow-statement", { symbol: symbolSchema.parse(symbol), limit: "5" }, 21_600_000); }
  async keyMetrics(symbol: string) { return this.request("/stable/key-metrics", { symbol: symbolSchema.parse(symbol), limit: "1" }, 21_600_000); }
  async ratios(symbol: string) { return this.request("/stable/ratios", { symbol: symbolSchema.parse(symbol), limit: "1" }, 21_600_000); }

  async quote(symbol: string, fresh = false): Promise<MarketQuote> {
    const normalized = symbolSchema.parse(symbol);
    const rows = await this.request("/stable/quote", { symbol: normalized }, 45_000, fresh);
    const quote = rows[0];
    const price = numberOf(quote?.price);
    if (!quote || !Number.isFinite(price) || price! <= 0) throw Errors.marketDataUnavailable();
    return {
      symbol: stringOf(quote.symbol) ?? normalized,
      price: price!,
      currency: stringOf(quote.currency) ?? "USD",
      change: numberOf(quote.change),
      changesPercentage: numberOf(quote.changesPercentage),
      name: stringOf(quote.name),
      retrievedAt: new Date().toISOString(),
      source: "FMP",
    };
  }

  async fundamentals(symbol: string) {
    const normalized = symbolSchema.parse(symbol);
    const [incomeStatement, balanceSheet, cashFlow, keyMetrics, ratios] = await Promise.all([
      this.incomeStatement(normalized), this.balanceSheet(normalized), this.cashFlow(normalized), this.keyMetrics(normalized), this.ratios(normalized),
    ]);
    const metrics = keyMetrics[0] ?? {};
    const ratio = ratios[0] ?? {};
    return {
      symbol: normalized,
      valuation: { peRatio: numberOf(metrics.peRatio), priceToBookRatio: numberOf(metrics.pbRatio), priceToSalesRatio: numberOf(metrics.priceToSalesRatio) },
      profitability: { returnOnEquity: numberOf(ratio.returnOnEquity), returnOnAssets: numberOf(ratio.returnOnAssets), netProfitMargin: numberOf(ratio.netProfitMargin) },
      growth: { revenue: numberOf(incomeStatement[0]?.revenue), netIncome: numberOf(incomeStatement[0]?.netIncome) },
      financialHealth: { totalDebt: numberOf(balanceSheet[0]?.totalDebt), currentRatio: numberOf(ratio.currentRatio) },
      cashFlow: { operatingCashFlow: numberOf(cashFlow[0]?.operatingCashFlow), freeCashFlow: numberOf(cashFlow[0]?.freeCashFlow) },
      source: "FMP",
      retrievedAt: new Date().toISOString(),
    };
  }
}
