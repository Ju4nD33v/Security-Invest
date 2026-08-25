import { z } from "zod";
import { getServerEnv } from "@/src/server/config/env";
import { Errors } from "@/src/server/errors/app-error";

export async function getExternalJson<T>(url: URL, schema: z.ZodType<T>, headers: HeadersInit = {}): Promise<T> {
  const { REQUEST_TIMEOUT_MS } = getServerEnv();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { method: "GET", headers, signal: controller.signal, cache: "no-store" });
      if (!response.ok) {
        if (response.status >= 500 && attempt === 0) continue;
        throw Errors.marketDataUnavailable();
      }
      return schema.parse(await response.json());
    } catch (error) {
      if (attempt === 0 && !(error instanceof z.ZodError)) continue;
      throw Errors.marketDataUnavailable();
    } finally {
      clearTimeout(timeout);
    }
  }
  throw Errors.marketDataUnavailable();
}
