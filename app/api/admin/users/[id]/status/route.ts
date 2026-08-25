import { NextRequest } from "next/server";
import { requireAdmin } from "@/src/server/auth/auth-context";
import { apiError, apiJson, apiOptions, requestId } from "@/src/server/http/api-response";
import { userIdParamsSchema, userStatusSchema } from "@/src/server/schemas/admin.schema";
import { AdminService } from "@/src/server/services/admin.service";
import { assertSameOrigin } from "@/src/server/security/request-security";
export const runtime = "nodejs";
export function OPTIONS(request: Request) { return apiOptions(request); }
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) { const id = requestId(); try { assertSameOrigin(request); const admin = await requireAdmin(); const target = userIdParamsSchema.parse(await context.params); const input = userStatusSchema.parse(await request.json()); await new AdminService().setUserStatus(admin.userId, target.id, input.accountStatus, id); return apiJson({ success: true }, request, 200, id); } catch (error) { return apiError(error, request, id); } }
