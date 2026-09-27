import { Router } from "express";
import {
  getAllLocations,
  getLocationById,
} from "./location.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getAllLocations);

router.get("/:id", authenticate, getLocationById);

export default router;