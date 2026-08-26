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
const brapiQuoteResponseSchema = z.object({
  results: z.array(z.object({ data: brapiQuoteDataSchema })).min(1),
});

export type BrapiQuoteData = z.infer<typeof brapiQuoteDataSchema>;

export class BrapiProvider {
  private readonly env = getServerEnv();
  private readonly baseUrl = this.env.BRAPI_BASE_URL ?? "https://brapi.dev";

  async getQuote(symbol: string, fresh = false): Promise<BrapiQuoteData> {
    if (!this.env.BRAPI_TOKEN) throw Errors.marketDataUnavailable();
    const normalized = symbolSchema.parse(symbol).replace(/\.SA$/, "");
    const url = new URL("/api/v2/stocks/quote", this.baseUrl);
    url.searchParams.set("symbols", normalized);
    const loader = async () => {
      const payload = await getExternalJson(url, brapiQuoteResponseSchema, {
        Authorization: `Bearer ${this.env.BRAPI_TOKEN}`,
      });
      return payload.results[0].data;
    };
    return fresh ? loader() : cached(`brapi:quote:${normalized}`, 45_000, loader);
  }

  normalizeSymbol(symbol: string) {
    return symbolSchema.parse(symbol).replace(/\.SA$/, "");
  }
}
