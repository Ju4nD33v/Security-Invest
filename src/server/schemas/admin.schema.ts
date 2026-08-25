import { z } from "zod";

export const userIdParamsSchema = z.object({ id: z.string().uuid() });
export const userStatusSchema = z.object({ accountStatus: z.enum(["ACTIVE", "SUSPENDED"]) });
