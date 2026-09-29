import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import { emitToPool } from "../../services/websocket.service.js";

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

  const rideRequest = await prisma.rideRequest.create({
    data: {
      passengerId,
      pickupLocationId,
      destinationLocationId,
      seatsRequested,
      poolingPreference,
      status: "REQUESTED",
      poolId: null,
    },
    include: {
      pickupLocation: true,
      destinationLocation: true,
    },
  });

  return rideRequest;
};

export const getRideById = async ({
  rideId,
  passengerId,
}) => {
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
    throw new AppError("Ride not found", 404);
  }

  if (ride.passengerId !== passengerId) {
    throw new AppError(
      "You are not authorized to view this ride",
      403
    );
  }

  return ride;
};

export const updatePoolingPreference = async ({
  rideId,
  passengerId,
  poolingPreference,
}) => {
  const ride = await prisma.rideRequest.findUnique({
    where: {
      id: rideId,
    },
  });

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  if (ride.passengerId !== passengerId) {
    throw new AppError(
      "You are not authorized to update this ride",
      403
    );
  }

  if (
    ride.status !== "REQUESTED" &&
    ride.status !== "MATCHED"
  ) {
    throw new AppError(
      "Pooling preference cannot be changed in the current ride state",
      400
    );
  }

  if (ride.poolingPreference === poolingPreference) {
    throw new AppError(
      "Pooling preference is already set to this value",
      400
    );
  }

  const updatedRide = await prisma.rideRequest.update({
    where: {
      id: rideId,
    },
    data: {
      poolingPreference,
    },
    include: {
      pickupLocation: true,
      destinationLocation: true,
      pool: true,
    },
  });

  if (updatedRide.poolId) {
    emitToPool(updatedRide.poolId, "ride:preferenceUpdated", {
      rideId,
      poolingPreference,
    });
  }

  return updatedRide;
};

export const cancelRide = async ({
  rideId,
  passengerId,
}) => {
  const ride = await prisma.rideRequest.findUnique({
    where: {
      id: rideId,
    },
  });

  if (!ride) {
    throw new AppError("Ride not found", 404);
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

  let poolCancelled = false;

  const cancelledRide = await prisma.$transaction(async (tx) => {
    const updatedRide = await tx.rideRequest.update({
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

    if (ride.poolId) {
      const remainingActiveRides = await tx.rideRequest.count({
        where: {
          poolId: ride.poolId,
          id: { not: rideId },
          status: { not: "CANCELLED" },
        },
      });

      if (remainingActiveRides === 0) {
        poolCancelled = true;
        await tx.pool.update({
          where: { id: ride.poolId },
          data: {
            status: "CANCELLED",
            seatsOccupied: 0,
          },
        });
      } else {
        await tx.pool.update({
          where: { id: ride.poolId },
          data: {
            seatsOccupied: {
              decrement: ride.seatsRequested,
            },
          },
        });
      }
    }

    return updatedRide;
  });

  if (ride.poolId) {
    emitToPool(ride.poolId, "ride:statusChanged", {
      rideId,
      status: "CANCELLED",
    });

    if (poolCancelled) {
      emitToPool(ride.poolId, "pool:statusChanged", {
        poolId: ride.poolId,
        status: "CANCELLED",
      });
    }
  }

  return cancelledRide;
};

export const getPassengerRideHistory = async (passengerId) => {
  return prisma.rideRequest.findMany({
    where: {
      passengerId,
      status: {
        in: ["COMPLETED", "CANCELLED"],
      },
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
    orderBy: {
      requestedAt: "desc",
    },
  });
};

export const getActiveRide = async (passengerId) => {
  return prisma.rideRequest.findFirst({
    where: {
      passengerId,
      status: {
        in: ["REQUESTED", "MATCHED", "STARTED"],
      },
    },
    include: {
      pickupLocation: true,
      destinationLocation: true,
      pool: {
        include: {
          vehicle: {
            include: {
              driver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          rideRequests: {
            where: {
              status: {
                not: "CANCELLED",
              },
            },
            select: {
              id: true,
              passengerId: true,
              seatsRequested: true,
              poolingPreference: true,
              status: true,
            },
          },
        },
      },
      fare: true,
    },
    orderBy: {
      requestedAt: "desc",
    },
  });
};