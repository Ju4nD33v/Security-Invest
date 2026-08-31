import { z } from "zod";
import { cached } from "@/src/server/cache/ttl-cache";
import { getServerEnv } from "@/src/server/config/env";
import { Errors } from "@/src/server/errors/app-error";
import { getExternalJson } from "@/src/server/integrations/http-client";
import type { MarketHistory, MarketHistoryPeriod } from "@/src/shared/market-history";

const symbolSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,20}$/);
const brapiQuoteDataSchema = z.object({
  shortName: z.string().optional(),
  longName: z.string().optional(),
  currency: z.string().min(1),
  regularMarketPrice: z.coerce.number().finite().positive(),
  regularMarketChange: z.coerce.number().finite().optional(),
  regularMarketChangePercent: z.coerce.number().finite().optional(),
  regularMarketTime: z.string().optional(),
});
const brapiQuoteResultSchema = z.object({
  symbol: z.string().min(1),
  data: brapiQuoteDataSchema,
});
const brapiQuoteResponseSchema = z.object({
  results: z.array(brapiQuoteResultSchema).min(1),
});
const brapiMarketListItemSchema = z.object({
  stock: z.string().min(1),
  name: z.string().optional(),
  close: z.coerce.number().finite().positive(),
  change: z.coerce.number().finite(),
  volume: z.coerce.number().finite().nonnegative().nullish(),
  market_cap: z.coerce.number().finite().nonnegative().nullish(),
});
const brapiMarketListResponseSchema = z.object({
  stocks: z.array(brapiMarketListItemSchema),
});
const brapiHistoryPointSchema = z.object({
  date: z.coerce.number().int().positive(),
  close: z.coerce.number().finite().positive(),
  adjustedClose: z.coerce.number().finite().positive().nullish(),
});
const brapiHistoricalResultSchema = z.object({
  symbol: z.string().min(1),
  data: z.object({
    usedInterval: z.string().min(1),
    usedRange: z.string().min(1),
    historicalDataPrice: z.array(brapiHistoryPointSchema).min(1),
  }),
});
const brapiHistoricalResponseSchema = z.object({
  results: z.array(brapiHistoricalResultSchema).min(1),
  requestedAt: z.string().optional(),
});

export type BrapiQuoteData = z.infer<typeof brapiQuoteDataSchema>;
export type BrapiQuoteResult = z.infer<typeof brapiQuoteResultSchema>;
export type BrapiMarketListItem = z.infer<typeof brapiMarketListItemSchema>;
type BrapiHistoricalResult = z.infer<typeof brapiHistoricalResultSchema>;

export function normalizeBrapiHistory(result: BrapiHistoricalResult, requestedPeriod: MarketHistoryPeriod, retrievedAt = new Date().toISOString()): MarketHistory {
  const points = result.data.historicalDataPrice
    .map((point) => ({ date: new Date(point.date * 1_000).toISOString(), close: point.adjustedClose ?? point.close }))
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
  if (!points.length) throw Errors.marketDataUnavailable();
  return {
    symbol: result.symbol,
    requestedPeriod,
    usedRange: result.data.usedRange,
    interval: result.data.usedInterval,
    points,
    source: "BRAPI",
    retrievedAt,
  };
}

export class BrapiProvider {
  private readonly env = getServerEnv();
  private readonly baseUrl = this.env.BRAPI_BASE_URL ?? "https://brapi.dev";

  async getQuote(symbol: string, fresh = false): Promise<BrapiQuoteData> {
    const results = await this.getQuoteRecords([symbol], fresh);
    return results[0].data;
  }

  async getQuoteRecords(symbols: string[], fresh = false): Promise<BrapiQuoteResult[]> {
    if (!this.env.BRAPI_TOKEN) throw Errors.marketDataUnavailable();
    const normalized = [...new Set(symbols.map((symbol) => symbolSchema.parse(symbol).replace(/\.SA$/, "")))];
    if (!normalized.length || normalized.length > 20) throw Errors.validation();
    const loader = async () => {
      const responses = await Promise.allSettled(normalized.map(async (symbol) => {
        const url = new URL("/api/v2/stocks/quote", this.baseUrl);
        url.searchParams.set("symbols", symbol);
        const payload = await getExternalJson(url, brapiQuoteResponseSchema, {
          Authorization: `Bearer ${this.env.BRAPI_TOKEN}`,
        });
        return payload.results[0];
      }));
      const records = responses
        .filter((response): response is PromiseFulfilledResult<BrapiQuoteResult> => response.status === "fulfilled")
        .map((response) => response.value);
      if (!records.length) throw Errors.marketDataUnavailable();
      return records;
    };
    return fresh ? loader() : cached(`brapi:quote:${normalized.join(",")}`, 45_000, loader);
  }

  async getMarketMovers(direction: "asc" | "desc", limit = 500): Promise<BrapiMarketListItem[]> {
    if (!this.env.BRAPI_TOKEN) throw Errors.marketDataUnavailable();
    const safeLimit = z.number().int().min(1).max(2_000).parse(limit);
    const loader = async () => {
      const url = new URL("/api/quote/list", this.baseUrl);
      url.searchParams.set("sortBy", "change");
      url.searchParams.set("sortOrder", direction);
      url.searchParams.set("type", "stock");
      url.searchParams.set("limit", String(safeLimit));
      const payload = await getExternalJson(url, brapiMarketListResponseSchema, {
        Authorization: `Bearer ${this.env.BRAPI_TOKEN}`,
      });
      return payload.stocks;
    };
    return cached(`brapi:market-movers:${direction}:${safeLimit}`, 300_000, loader);
  }

  async getHistoricalPrices(symbol: string, period: MarketHistoryPeriod): Promise<MarketHistory> {
    if (!this.env.BRAPI_TOKEN) throw Errors.marketDataUnavailable();
    const normalized = this.normalizeSymbol(symbol);
    const loader = async () => {
      const url = new URL("/api/v2/stocks/historical", this.baseUrl);
      url.searchParams.set("symbols", normalized);
      url.searchParams.set("range", period);
      url.searchParams.set("interval", "1d");
      url.searchParams.set("sortOrder", "asc");
      const payload = await getExternalJson(url, brapiHistoricalResponseSchema, {
        Authorization: `Bearer ${this.env.BRAPI_TOKEN}`,
      });
      return normalizeBrapiHistory(payload.results[0], period, payload.requestedAt ?? new Date().toISOString());
    };
    return cached(`brapi:history:${normalized}:${period}:1d`, 300_000, loader);
  }

  normalizeSymbol(symbol: string) {
    return symbolSchema.parse(symbol).replace(/\.SA$/, "");
  }
}
