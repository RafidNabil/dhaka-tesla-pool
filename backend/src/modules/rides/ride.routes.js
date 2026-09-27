import { Router } from "express";
import {
  createRide,
  getRideById,
  cancelRide,
} from "./ride.controller.js";
import { createRideSchema } from "./ride.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requireRole("PASSENGER"),
  validate(createRideSchema),
  createRide
);

router.get("/:id", getRideById);

router.post("/:id/cancel", cancelRide);

export default router;