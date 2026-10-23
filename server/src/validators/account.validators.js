import { z } from "zod";

export const summaryQuerySchema = z.object({
  query: z.object({ range: z.enum(["7d", "30d", "90d"]).default("30d") }).strict(),
});
