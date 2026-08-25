import { NextRequest } from "next/server";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { requireUser } from "@/src/server/auth/auth-context";

export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    return apiJson({ user }, request);
  } catch (error) {
    return apiError(error, request);
  }
}
