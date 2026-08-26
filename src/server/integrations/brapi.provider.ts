import { z } from "zod";
import { cached } from "@/src/server/cache/ttl-cache";
import { getServerEnv } from "@/src/server/config/env";
import { Errors } from "@/src/server/errors/app-error";
import { getExternalJson } from "@/src/server/integrations/http-client";

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

export type BrapiQuoteData = z.infer<typeof brapiQuoteDataSchema>;
export type BrapiQuoteResult = z.infer<typeof brapiQuoteResultSchema>;

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
      const chunks = Array.from({ length: Math.ceil(normalized.length / 2) }, (_, index) => normalized.slice(index * 2, index * 2 + 2));
      const results = await Promise.all(chunks.map(async (chunk) => {
        const url = new URL("/api/v2/stocks/quote", this.baseUrl);
        url.searchParams.set("symbols", chunk.join(","));
        try {
          const payload = await getExternalJson(url, brapiQuoteResponseSchema, {
            Authorization: `Bearer ${this.env.BRAPI_TOKEN}`,
          });
          return payload.results;
        } catch {
          return [];
        }
      }));
      const records = results.flat();
      if (!records.length) throw Errors.marketDataUnavailable();
      return records;
    };
    return fresh ? loader() : cached(`brapi:quote:${normalized.join(",")}`, 45_000, loader);
  }

  normalizeSymbol(symbol: string) {
    return symbolSchema.parse(symbol).replace(/\.SA$/, "");
  }
}
