import { describe, expect, it } from "vitest";
import { normalizeBrapiHistory } from "@/src/server/integrations/brapi.provider";

describe("BRAPI historical prices", () => {
  it("normalizes adjusted prices and sorts points chronologically", () => {
    const history = normalizeBrapiHistory({
      symbol: "PETR4",
      data: {
        usedInterval: "1d",
        usedRange: "1mo",
        historicalDataPrice: [
          { date: 1_735_862_400, close: 39.2, adjustedClose: 38.9 },
          { date: 1_735_776_000, close: 38.1, adjustedClose: null },
        ],
      },
    }, "1mo", "2026-08-31T12:00:00.000Z");

    expect(history).toMatchObject({ symbol: "PETR4", source: "BRAPI", requestedPeriod: "1mo", usedRange: "1mo" });
    expect(history.points).toEqual([
      { date: "2025-01-02T00:00:00.000Z", close: 38.1 },
      { date: "2025-01-03T00:00:00.000Z", close: 38.9 },
    ]);
  });
});
