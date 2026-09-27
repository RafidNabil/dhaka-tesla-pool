import { Router } from "express";

import {
  getPoolById,
  getMatchingPools,
  startPool,
} from "./pool.controller.js";

import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/matching",
  requireRole("DRIVER"),
  getMatchingPools
);

router.get("/:id", getPoolById);

router.post(
  "/:id/start",
  requireRole("DRIVER"),
  startPool
);

export default router;