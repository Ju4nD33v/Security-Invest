import { NextRequest } from "next/server";
import { requireAdmin } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions } from "@/src/server/http/api-response";
import { AdminService } from "@/src/server/services/admin.service";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function GET(request: NextRequest) { try { await requireAdmin(); return apiJson({ users: await new AdminService().users(request.nextUrl.searchParams.get("q")) }, request); } catch (error) { return apiError(error, request); } }
