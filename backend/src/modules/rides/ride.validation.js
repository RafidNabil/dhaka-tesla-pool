import { z } from "zod";

export const createRideSchema = z.object({
  pickupLocationId: z.string().uuid("Invalid pickup location ID"),

  destinationLocationId: z
    .string()
    .uuid("Invalid destination location ID"),

  seatsRequested: z
    .number()
    .int("Seats must be a whole number")
    .min(1, "At least 1 seat is required")
    .max(3, "Maximum 3 seats can be requested"),

  poolingPreference: z.enum(["WAIT", "IMMEDIATE"]),
});

export const updatePoolingPreferenceSchema = z.object({
  poolingPreference: z.enum(["WAIT", "IMMEDIATE"]),
});