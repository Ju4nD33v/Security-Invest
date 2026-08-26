import { BrapiProvider } from "@/src/server/integrations/brapi.provider";
import { FmpProvider, type MarketQuote as FmpMarketQuote } from "@/src/server/integrations/fmp.provider";

export type MarketQuote = Omit<FmpMarketQuote, "source"> & { source: "FMP" | "BRAPI" };

function isB3Symbol(symbol: string) {
  return /^(?:[A-Z]{4}\d{1,2}|[A-Z]\d[A-Z]{2}\d{1,2})(?:\.SA)?$/.test(symbol.trim().toUpperCase());
}

export class MarketQuoteProvider {
  constructor(private readonly fmp = new FmpProvider(), private readonly brapi = new BrapiProvider()) {}

  async quote(symbol: string, fresh = false): Promise<MarketQuote> {
    if (!isB3Symbol(symbol)) return this.fmp.quote(symbol, fresh);
    const quote = await this.brapi.getQuote(symbol, fresh);
    return {
      symbol: this.brapi.normalizeSymbol(symbol),
      price: quote.regularMarketPrice,
      currency: quote.currency,
      change: quote.regularMarketChange,
      changesPercentage: quote.regularMarketChangePercent,
      name: quote.longName ?? quote.shortName,
      retrievedAt: quote.regularMarketTime ?? new Date().toISOString(),
      source: "BRAPI",
    };
  }
}
