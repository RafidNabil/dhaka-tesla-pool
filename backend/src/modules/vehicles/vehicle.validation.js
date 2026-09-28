import { z } from "zod";

export const updateVehicleStatusSchema = z.object({
  online: z.boolean(),
});