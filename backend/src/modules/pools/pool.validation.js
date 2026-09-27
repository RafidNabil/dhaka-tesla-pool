import { z } from "zod";

export const poolIdSchema = z.object({
  id: z.string().uuid("Invalid pool ID"),
});