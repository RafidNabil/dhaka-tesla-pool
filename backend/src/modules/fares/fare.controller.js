import * as fareService from "./fare.service.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";

export const estimateFare = async (req, res, next) => {
  try {
    const { pickupLocationId, destinationLocationId } = req.body;

    if (pickupLocationId === destinationLocationId) {
      throw new AppError(
        "Pickup and destination cannot be the same",
        400
      );
    }

    const pickupLocation = await prisma.location.findUnique({
      where: { id: pickupLocationId },
    });

    if (!pickupLocation) {
      throw new AppError("Pickup location not found", 404);
    }

    const destinationLocation = await prisma.location.findUnique({
      where: { id: destinationLocationId },
    });

    if (!destinationLocation) {
      throw new AppError("Destination location not found", 404);
    }

    const estimate = fareService.calculateFareForLocations({
      pickupLocation,
      destinationLocation,
    });

    res.status(200).json({
      success: true,
      estimate,
    });
  } catch (error) {
    next(error);
  }
};