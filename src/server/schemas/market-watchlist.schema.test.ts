import { describe, expect, it } from "vitest";
import { marketHistoryQuerySchema, marketSearchSchema, symbolParamsSchema } from "@/src/server/schemas/market.schema";
import { watchlistAssetSchema } from "@/src/server/schemas/watchlist.schema";

describe("market and watchlist validation", () => {
  it("normalizes symbols accepted by the allowlist", () => {
    expect(watchlistAssetSchema.parse({ symbol: " petr4 " })).toEqual({ symbol: "PETR4" });
    expect(symbolParamsSchema.parse({ symbol: "brk.b" })).toEqual({ symbol: "BRK.B" });
  });

  it("rejects injection, traversal and XSS-shaped input", () => {
    for (const symbol of ["' OR '1'='1", "../../../etc/passwd", "<script>alert(1)</script>"]) {
      expect(watchlistAssetSchema.safeParse({ symbol }).success).toBe(false);
      expect(symbolParamsSchema.safeParse({ symbol }).success).toBe(false);
    }
    expect(marketSearchSchema.safeParse({ q: "x".repeat(81) }).success).toBe(false);
    expect(marketHistoryQuerySchema.safeParse({ period: "10y" }).success).toBe(false);
  });

  it("only accepts the chart periods exposed by the interface", () => {
    expect(marketHistoryQuerySchema.parse({})).toEqual({ period: "1mo" });
    expect(marketHistoryQuerySchema.parse({ period: "7d" })).toEqual({ period: "7d" });
    expect(marketHistoryQuerySchema.parse({ period: "1y" })).toEqual({ period: "1y" });
  });
});
