import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import locationRoutes from "../modules/locations/location.routes.js";
import fareRoutes from "../modules/fares/fare.routes.js";
import rideRoutes from "../modules/rides/ride.routes.js";
import poolRoutes from "../modules/pools/pool.routes.js";
import offerRoutes from "../modules/offers/offer.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/locations", locationRoutes);
router.use("/fares", fareRoutes);
router.use("/rides", rideRoutes);
router.use("/pools", poolRoutes);
router.use("/offers", offerRoutes);

export default router;

