export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: () => new AppError("UNAUTHORIZED", 401, "Autenticação necessária."),
  forbidden: () => new AppError("FORBIDDEN", 403, "Você não tem permissão para esta ação."),
  suspended: () => new AppError("ACCOUNT_SUSPENDED", 403, "Esta conta está suspensa."),
  notFound: (resource = "Recurso") => new AppError("NOT_FOUND", 404, `${resource} não encontrado.`),
  validation: (details?: Record<string, unknown>) => new AppError("VALIDATION_ERROR", 400, "Dados inválidos.", details),
  rateLimited: () => new AppError("RATE_LIMITED", 429, "Muitas tentativas. Tente novamente mais tarde."),
  marketDataUnavailable: () => new AppError("MARKET_DATA_UNAVAILABLE", 503, "Dados de mercado indisponíveis no momento."),
  stalePrice: () => new AppError("STALE_MARKET_DATA", 503, "A cotação disponível está desatualizada."),
  conflict: (code: string, message: string) => new AppError(code, 409, message),
};
