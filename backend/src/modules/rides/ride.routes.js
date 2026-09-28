import { Router } from "express";
import {
  createRide,
  getRideById,
  cancelRide,
  updatePoolingPreference,
  getPassengerRideHistory
} from "./ride.controller.js";
import { createRideSchema, updatePoolingPreferenceSchema } from "./ride.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/history",
  requireRole("PASSENGER"),
  getPassengerRideHistory
);

router.post(
  "/",
  requireRole("PASSENGER"),
  validate(createRideSchema),
  createRide
);

router.get("/:id", getRideById);

router.patch(
  "/:id/pooling-preference",
  requireRole("PASSENGER"),
  validate(updatePoolingPreferenceSchema),
  updatePoolingPreference
);

router.post("/:id/cancel", cancelRide);

export default router;