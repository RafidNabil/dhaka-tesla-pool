import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";

export const createRide = async ({
  passengerId,
  pickupLocationId,
  destinationLocationId,
  seatsRequested,
  poolingPreference,
}) => {
  if (pickupLocationId === destinationLocationId) {
    throw new AppError(
      "Pickup and destination cannot be the same",
      400
    );
  }

  const pickupLocation = await prisma.location.findUnique({
    where: {
      id: pickupLocationId,
    },
  });

  if (!pickupLocation) {
    throw new AppError("Pickup location not found", 404);
  }

  const destinationLocation = await prisma.location.findUnique({
    where: {
      id: destinationLocationId,
    },
  });

  if (!destinationLocation) {
    throw new AppError("Destination location not found", 404);
  }

  const result = await prisma.$transaction(async (tx) => {
    const pool = await tx.pool.create({
      data: {
        status: "MATCHING",
        seatsOccupied: seatsRequested,
      },
    });

    const rideRequest = await tx.rideRequest.create({
      data: {
        passengerId,
        poolId: pool.id,
        pickupLocationId,
        destinationLocationId,
        seatsRequested,
        poolingPreference,
        status: "REQUESTED",
      },
      include: {
        pickupLocation: true,
        destinationLocation: true,
        pool: true,
      },
    });

    return rideRequest;
  });

  return result;
};

export const getRideById = async ({ rideId, passengerId }) => {
  const ride = await prisma.rideRequest.findUnique({
    where: {
      id: rideId,
    },
    include: {
      pickupLocation: true,
      destinationLocation: true,
      pool: {
        include: {
          vehicle: true,
        },
      },
      fare: true,
    },
  });

  if (!ride) {
    throw new AppError("Ride Request not found", 404);
  }

  if (ride.passengerId !== passengerId) {
    throw new AppError(
      "You are not authorized to view this ride",
      403
    );
  }

  return ride;
};

export const cancelRide = async ({ rideId, passengerId }) => {
  const ride = await prisma.rideRequest.findUnique({
    where: {
      id: rideId,
    },
  });

  if (!ride) {
    throw new AppError("Ride Request not found", 404);
  }

  if (ride.passengerId !== passengerId) {
    throw new AppError(
      "You are not authorized to cancel this ride",
      403
    );
  }

  if (
    ride.status !== "REQUESTED" &&
    ride.status !== "MATCHED"
  ) {
    throw new AppError(
      "Ride cannot be cancelled in its current state",
      400
    );
  }

  return prisma.rideRequest.update({
    where: {
      id: rideId,
    },
    data: {
      status: "CANCELLED",
    },
    include: {
      pickupLocation: true,
      destinationLocation: true,
      pool: true,
    },
  });
};