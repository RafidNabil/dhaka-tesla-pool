import { Router } from "express";
import {
  getPoolById,
  getMatchingPools,
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

export default router;