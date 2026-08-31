import { BrapiProvider } from "@/src/server/integrations/brapi.provider";
import type { BrapiMarketListItem } from "@/src/server/integrations/brapi.provider";
import type { MarketQuote } from "@/src/server/integrations/market-quote.provider";

function normalizeQuote(item: BrapiMarketListItem): MarketQuote {
  return {
    symbol: item.stock,
    price: item.close,
    currency: "BRL",
    changesPercentage: item.change,
    name: item.name,
    retrievedAt: new Date().toISOString(),
    source: "BRAPI",
  };
}

function isPrincipalStock(item: BrapiMarketListItem) {
  return /^[A-Z]{4}\d{1,2}$/.test(item.stock)
    && !item.stock.endsWith("F")
    && (item.volume ?? 0) >= 500_000
    && (item.market_cap ?? 0) >= 1_000_000_000;
}

export class MarketHighlightsService {
  constructor(private readonly brapi = new BrapiProvider()) {}

  async getB3Highlights() {
    const [risingRecords, fallingRecords] = await Promise.all([
      this.brapi.getMarketMovers("desc"),
      this.brapi.getMarketMovers("asc"),
    ]);
    const rising = risingRecords.filter(isPrincipalStock).map(normalizeQuote)
      .filter((quote) => (quote.changesPercentage ?? 0) >= 0).slice(0, 5);
    const falling = fallingRecords.filter(isPrincipalStock).map(normalizeQuote)
      .filter((quote) => (quote.changesPercentage ?? 0) < 0).slice(0, 5);
    return {
      rising,
      falling,
      monitoredSymbols: rising.length + falling.length,
      source: "BRAPI" as const,
      retrievedAt: new Date().toISOString(),
    };
  }
}
