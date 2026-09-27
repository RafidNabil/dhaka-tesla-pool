import { Router } from "express";
import { estimateFare } from "./fare.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/estimate", authenticate, estimateFare);

export default router;