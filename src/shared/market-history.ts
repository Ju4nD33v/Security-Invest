export const MARKET_HISTORY_PERIODS = ["7d", "1mo", "1y"] as const;

export type MarketHistoryPeriod = (typeof MARKET_HISTORY_PERIODS)[number];

export type MarketHistoryPoint = {
  date: string;
  close: number;
};

export type MarketHistory = {
  symbol: string;
  requestedPeriod: MarketHistoryPeriod;
  usedRange: string;
  interval: string;
  points: MarketHistoryPoint[];
  source: "BRAPI" | "FMP";
  retrievedAt: string;
};

export const MARKET_HISTORY_PERIOD_LABELS: Record<MarketHistoryPeriod, string> = {
  "7d": "1 semana",
  "1mo": "1 mês",
  "1y": "1 ano",
};
