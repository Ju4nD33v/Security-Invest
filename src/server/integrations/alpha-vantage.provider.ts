import { z } from "zod";
import { cached } from "@/src/server/cache/ttl-cache";
import { getServerEnv } from "@/src/server/config/env";
import { Errors } from "@/src/server/errors/app-error";
import { getExternalJson } from "@/src/server/integrations/http-client";

const responseSchema = z.object({}).passthrough();
const symbolSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9.\-]{1,20}$/);

function latestIndicator(response: Record<string, unknown>, key: string) {
  const series = response[key];
  if (!series || typeof series !== "object" || Array.isArray(series)) return null;
  const [date, values] = Object.entries(series).sort(([a], [b]) => b.localeCompare(a))[0] ?? [];
  return date && values && typeof values === "object" && !Array.isArray(values) ? { date, values } : null;
}

export class AlphaVantageProvider {
  private readonly env = getServerEnv();
  private readonly baseUrl = this.env.ALPHA_VANTAGE_BASE_URL ?? "https://www.alphavantage.co";

  private async query(params: Record<string, string>, ttlMs: number) {
    if (!this.env.ALPHA_VANTAGE_API_KEY) throw Errors.marketDataUnavailable();
    const url = new URL("/query", this.baseUrl);
    Object.entries({ ...params, apikey: this.env.ALPHA_VANTAGE_API_KEY }).forEach(([key, value]) => url.searchParams.set(key, value));
    return cached(`alpha:${url.searchParams.toString()}`, ttlMs, async () => {
      const data = await getExternalJson(url, responseSchema);
      if ("Error Message" in data || "Information" in data || "Note" in data) throw Errors.marketDataUnavailable();
      return data;
    });
  }

  private indicator(symbol: string, fn: "RSI" | "SMA" | "EMA" | "MACD", extra: Record<string, string> = {}) {
    const normalized = symbolSchema.parse(symbol);
    const params = { function: fn, symbol: normalized, interval: "daily", series_type: "close", ...extra };
    return this.query(params, 600_000).then((response) => latestIndicator(response, `Technical Analysis: ${fn}`));
  }

  async technical(symbol: string) {
    const [rsi, sma20, sma50, ema20, macd] = await Promise.all([
      this.indicator(symbol, "RSI", { time_period: "14" }), this.indicator(symbol, "SMA", { time_period: "20" }), this.indicator(symbol, "SMA", { time_period: "50" }), this.indicator(symbol, "EMA", { time_period: "20" }), this.indicator(symbol, "MACD"),
    ]);
    return { symbol: symbolSchema.parse(symbol), indicators: { rsi, sma20, sma50, ema20, macd }, source: "Alpha Vantage", retrievedAt: new Date().toISOString() };
  }

  async sentiment(symbol: string) {
    const normalized = symbolSchema.parse(symbol);
    const response = await this.query({ function: "NEWS_SENTIMENT", tickers: normalized, limit: "20" }, 600_000);
    const feed = Array.isArray(response.feed) ? response.feed : [];
    const articles = feed.flatMap((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const article = item as Record<string, unknown>;
      return [{ title: typeof article.title === "string" ? article.title : "", url: typeof article.url === "string" ? article.url : "", timePublished: typeof article.time_published === "string" ? article.time_published : "", sentimentLabel: typeof article.overall_sentiment_label === "string" ? article.overall_sentiment_label : undefined, sentimentScore: typeof article.overall_sentiment_score === "string" ? Number(article.overall_sentiment_score) : undefined }];
    });
    const scores = articles.map((article) => article.sentimentScore).filter((score): score is number => Number.isFinite(score));
    return { symbol: normalized, articleCount: articles.length, aggregateSentiment: scores.length ? scores.reduce((total, score) => total + score, 0) / scores.length : null, articles, source: "Alpha Vantage", retrievedAt: new Date().toISOString() };
  }
}
