import { MarketQuoteProvider } from "@/src/server/integrations/market-quote.provider";
import { PaperTradingProvider } from "@/src/server/services/paper-trading.service";

const asNumber = (value: number | string) => typeof value === "number" ? value : Number(value);

export class PortfolioService {
  constructor(private readonly trading = new PaperTradingProvider(), private readonly market = new MarketQuoteProvider()) {}

  async getPortfolio(userId: string) {
    const [account, positions] = await Promise.all([this.trading.getAccount(userId), this.trading.getPositions(userId)]);
    const enrichedPositions = await Promise.all(positions.map(async (position) => {
      const quantity = asNumber(position.quantity);
      const averagePrice = asNumber(position.average_price);
      try {
        const quote = await this.market.quote(position.symbol);
        if (quote.currency !== account.currency) return { ...position, marketDataAvailable: false };
        const currentValue = quantity * quote.price;
        const investedValue = quantity * averagePrice;
        const unrealizedPnl = currentValue - investedValue;
        return { ...position, marketDataAvailable: true, quote, investedValue, currentValue, unrealizedPnl, unrealizedPnlPercent: investedValue ? (unrealizedPnl / investedValue) * 100 : 0 };
      } catch { return { ...position, marketDataAvailable: false }; }
    }));
    const valued = enrichedPositions.filter((position): position is typeof position & { investedValue: number; currentValue: number } => position.marketDataAvailable && "investedValue" in position && "currentValue" in position);
    const investedValue = valued.reduce((total, position) => total + position.investedValue, 0);
    const currentValue = valued.reduce((total, position) => total + position.currentValue, 0);
    const unrealizedPnl = currentValue - investedValue;
    const cashBalance = asNumber(account.cash_balance);
    return { simulation: true, account, positions: enrichedPositions, summary: { cashBalance, investedValue, currentValue, totalEquity: cashBalance + currentValue, unrealizedPnl, unrealizedPnlPercent: investedValue ? (unrealizedPnl / investedValue) * 100 : 0, positionCount: positions.length, valuationCoverage: { valued: valued.length, total: positions.length } } };
  }
}
