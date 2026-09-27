import { Router } from "express";
import {
  getOfferById,
  getDriverOffers,
  acceptOffer,
  rejectOffer,
} from "./offer.controller.js";
import {
  authenticate,
  requireRole,
} from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("DRIVER"));

router.get("/", getDriverOffers);

router.get("/:id", getOfferById);

router.post("/:id/accept", acceptOffer);

router.post("/:id/reject", rejectOffer);

export default router;