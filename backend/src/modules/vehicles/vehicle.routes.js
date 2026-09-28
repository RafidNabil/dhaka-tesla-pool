import { Router } from "express";

import {
  updateVehicleStatus,
  getMyVehicle,
} from "./vehicle.controller.js";

import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

import { validate } from "../../middlewares/validate.middleware.js";

import {
  updateVehicleStatusSchema,
} from "./vehicle.validation.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("DRIVER"));

router.get("/me", getMyVehicle);

router.patch(
  "/status",
  validate(updateVehicleStatusSchema),
  updateVehicleStatus
);

export default router;