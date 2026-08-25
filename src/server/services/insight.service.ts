import { AlphaVantageProvider } from "@/src/server/integrations/alpha-vantage.provider";
import { FmpProvider } from "@/src/server/integrations/fmp.provider";

export class InsightService {
  constructor(private readonly fmp = new FmpProvider(), private readonly alpha = new AlphaVantageProvider()) {}

  async generate(symbol: string) {
    const [market, fundamentals, technicalResult, sentimentResult] = await Promise.allSettled([
      this.fmp.quote(symbol), this.fmp.fundamentals(symbol), this.alpha.technical(symbol), this.alpha.sentiment(symbol),
    ]);
    if (market.status === "rejected") throw market.reason;
    if (fundamentals.status === "rejected") throw fundamentals.reason;
    const technical = technicalResult.status === "fulfilled" ? technicalResult.value : null;
    const sentiment = sentimentResult.status === "fulfilled" ? sentimentResult.value : null;
    const positiveFactors: string[] = [];
    const riskFactors: string[] = [];
    if ((market.value.changesPercentage ?? 0) > 0) positiveFactors.push("A cotação apresenta variação positiva na referência consultada.");
    const rsi = technical?.indicators.rsi;
    if (rsi && typeof rsi.values.RSI === "string" && Number(rsi.values.RSI) > 70) riskFactors.push("O RSI está acima de 70, um sinal técnico que pode indicar movimento esticado.");
    if ((sentiment?.aggregateSentiment ?? 0) < 0) riskFactors.push("O sentimento agregado das notícias recentes é negativo.");
    if (!positiveFactors.length) positiveFactors.push("Não houve sinal positivo determinístico relevante nos dados consultados.");
    if (!riskFactors.length) riskFactors.push("Indicadores técnicos e notícias são dados contextuais, não previsões de retorno.");
    return { symbol: market.value.symbol, market: market.value, fundamentals: fundamentals.value, technical, sentiment, insight: { summary: "Leitura informativa baseada em dados de mercado, fundamentos, indicadores técnicos e notícias disponíveis no momento da consulta. Não constitui recomendação de investimento.", positiveFactors, riskFactors }, sources: ["Financial Modeling Prep", "Alpha Vantage"], generatedAt: new Date().toISOString() };
  }
}
