import { Router } from "express";

import {
  getPoolById,
  getMatchingPools,
  arriveAtPool,
  startPool,
  completePool,
  getDriverPoolHistory
} from "./pool.controller.js";

import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/history",
  requireRole("DRIVER"),
  getDriverPoolHistory
);

router.get(
  "/matching",
  requireRole("DRIVER"),
  getMatchingPools
);

router.get("/:id", getPoolById);

router.post(
  "/:id/arrive",
  requireRole("DRIVER"),
  arriveAtPool
);

router.post(
  "/:id/start",
  requireRole("DRIVER"),
  startPool
);

router.post(
  "/:id/complete",
  requireRole("DRIVER"),
  completePool
);

export default router;