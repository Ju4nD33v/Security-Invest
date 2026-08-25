import { describe, expect, it } from "vitest";
import { createOrderSchema } from "@/src/server/schemas/trading.schema";

describe("paper trading order validation", () => {
  it("accepts a valid market order and strips a client supplied price", () => {
    const order = createOrderSchema.parse({ symbol: "aapl", side: "BUY", quantity: 10, orderType: "MARKET", price: 1 });
    expect(order).toEqual({ symbol: "AAPL", side: "BUY", quantity: 10, orderType: "MARKET" });
  });

  it("rejects unsupported order types and invalid quantities", () => {
    expect(createOrderSchema.safeParse({ symbol: "AAPL", side: "BUY", quantity: 0, orderType: "MARKET" }).success).toBe(false);
    expect(createOrderSchema.safeParse({ symbol: "AAPL", side: "BUY", quantity: 1, orderType: "LIMIT" }).success).toBe(false);
  });
});
