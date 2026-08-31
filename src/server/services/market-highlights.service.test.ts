import { describe, expect, it } from "vitest";
import { normalizeMarketListQuote } from "@/src/server/services/market-highlights.service";

describe("normalizeMarketListQuote", () => {
  it("preenche a variação percentual e a variação absoluta exigidas pela cotação", () => {
    const quote = normalizeMarketListQuote({
      stock: "PETR4",
      name: "Petrobras",
      close: 42,
      change: 5,
      volume: 10_000_000,
      market_cap: 500_000_000_000,
    }, "2026-08-31T12:00:00.000Z");

    expect(quote).toMatchObject({
      symbol: "PETR4",
      price: 42,
      changesPercentage: 5,
      source: "BRAPI",
      retrievedAt: "2026-08-31T12:00:00.000Z",
    });
    expect(quote.change).toBeCloseTo(2, 8);
  });
});
