import { BrapiProvider } from "@/src/server/integrations/brapi.provider";
import type { MarketQuote } from "@/src/server/integrations/market-quote.provider";

// A BRAPI disponibiliza estes tickers também em credenciais de entrada; planos
// com cobertura ampliada podem expandir a lista sem alterar o contrato da rota.
const monitoredB3Symbols = ["PETR4", "VALE3", "ITUB4", "MGLU3"];

function normalizeQuote(symbol: string, data: Awaited<ReturnType<BrapiProvider["getQuote"]>>): MarketQuote {
  return {
    symbol,
    price: data.regularMarketPrice,
    currency: data.currency,
    change: data.regularMarketChange,
    changesPercentage: data.regularMarketChangePercent,
    name: data.longName ?? data.shortName,
    retrievedAt: data.regularMarketTime ?? new Date().toISOString(),
    source: "BRAPI",
  };
}

export class MarketHighlightsService {
  constructor(private readonly brapi = new BrapiProvider()) {}

  async getB3Highlights() {
    const records = await this.brapi.getQuoteRecords(monitoredB3Symbols);
    const quotes = records.map((record) => normalizeQuote(record.symbol, record.data)).filter((quote) => quote.changesPercentage !== undefined);
    const byVariation = (a: MarketQuote, b: MarketQuote) => (b.changesPercentage ?? 0) - (a.changesPercentage ?? 0);
    const rising = [...quotes].filter((quote) => (quote.changesPercentage ?? 0) >= 0).sort(byVariation).slice(0, 5);
    const falling = [...quotes].filter((quote) => (quote.changesPercentage ?? 0) < 0).sort(byVariation).reverse().slice(0, 5);
    return { rising, falling, monitoredSymbols: quotes.length, source: "BRAPI" as const, retrievedAt: new Date().toISOString() };
  }
}
