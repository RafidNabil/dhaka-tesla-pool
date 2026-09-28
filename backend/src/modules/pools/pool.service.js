import { prisma } from "../../config/prisma.js";
import { emitToPool } from "../../services/websocket.service.js";
import { AppError } from "../../utils/errors.js";
import { calculateDistanceKm } from "../../services/distance.service.js";
import { calculatePoolFares } from "../fares/fare.service.js";

export const getPoolById = async (poolId) => {
  const pool = await prisma.pool.findUnique({
    where: {
      id: poolId,
    },
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
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          pickupLocation: true,
          destinationLocation: true,
          fare: true,
        },
      },
      offers: {
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
    },
  });

  if (!pool) {
    throw new AppError("Pool not found", 404);
  }

  return pool;
};

export const getMatchingPools = async () => {
  return prisma.pool.findMany({
    where: {
      status: "MATCHING",
    },
    include: {
      rideRequests: {
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
            },
          },
          pickupLocation: true,
          destinationLocation: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const startPool = async ({
  poolId,
  driverId,
}) => {
  const pool = await prisma.$transaction(async (tx) => {
    const existingPool = await tx.pool.findUnique({
      where: {
        id: poolId,
      },
      include: {
        vehicle: true,
      },
    });

    if (!existingPool) {
      throw new AppError("Pool not found", 404);
    }

    if (!existingPool.vehicle) {
      throw new AppError(
        "This pool does not have a driver assigned",
        400
      );
    }

    if (existingPool.vehicle.driverId !== driverId) {
      throw new AppError(
        "You are not the driver assigned to this pool",
        403
      );
    }

    if (existingPool.status !== "CONFIRMED") {
      throw new AppError(
        "Pool is not confirmed and cannot be started",
        400
      );
    }

    const updatedPool = await tx.pool.update({
      where: {
        id: poolId,
      },
      data: {
        status: "ACTIVE",
      },
    });

    await tx.rideRequest.updateMany({
      where: {
        poolId,
        status: "MATCHED",
      },
      data: {
        status: "STARTED",
      },
    });

    return updatedPool;
  });

  emitToPool(poolId, "pool:statusChanged", {
    poolId,
    status: "ACTIVE",
  });

  emitToPool(poolId, "ride:statusChanged", {
    poolId,
    status: "STARTED",
  });

  return pool;
};

export const completePool = async ({
  poolId,
  driverId,
}) => {
  const pool = await prisma.$transaction(async (tx) => {
    const existingPool = await tx.pool.findUnique({
      where: { id: poolId },
      include: { vehicle: true },
    });

    if (!existingPool) {
      throw new AppError("Pool not found", 404);
    }

    if (!existingPool.vehicle) {
      throw new AppError(
        "This pool does not have a driver assigned",
        400
      );
    }

    if (existingPool.vehicle.driverId !== driverId) {
      throw new AppError(
        "You are not the driver assigned to this pool",
        403
      );
    }

    if (existingPool.status !== "ACTIVE") {
      throw new AppError(
        "Pool is not active and cannot be completed",
        400
      );
    }

    const updatedPool = await tx.pool.update({
      where: { id: poolId },
      data: {
        status: "COMPLETED",
      },
    });

    await tx.rideRequest.updateMany({
      where: {
        poolId,
        status: "STARTED",
      },
      data: {
        status: "COMPLETED",
      },
    });

    return updatedPool;
  });

  emitToPool(poolId, "pool:statusChanged", {
    poolId,
    status: "COMPLETED",
  });

  emitToPool(poolId, "ride:statusChanged", {
    poolId,
    status: "COMPLETED",
  });

  return pool;
};

export const arriveAtPool = async ({
  poolId,
  driverId,
}) => {
  const pool = await prisma.$transaction(async (tx) => {
    const existingPool = await tx.pool.findUnique({
      where: { id: poolId },
      include: {
        vehicle: true,
      },
    });

    if (!existingPool) {
      throw new AppError("Pool not found", 404);
    }

    if (!existingPool.vehicle) {
      throw new AppError(
        "This pool does not have a driver assigned",
        400
      );
    }

    if (existingPool.vehicle.driverId !== driverId) {
      throw new AppError(
        "You are not the driver assigned to this pool",
        403
      );
    }

    if (
      existingPool.status !== "MATCHING" &&
      existingPool.status !== "CONFIRMED"
    ) {
      throw new AppError(
        "Pool has already started or ended",
        400
      );
    }

    if (existingPool.driverArrivedAt) {
      throw new AppError(
        "Driver has already arrived",
        400
      );
    }

    return tx.pool.update({
      where: { id: poolId },
      data: {
        driverArrivedAt: new Date(),
      },
    });
  });

  emitToPool(poolId, "pool:driverArrived", {
    poolId,
    driverArrivedAt: pool.driverArrivedAt,
  });

  return pool;
};

export const getDriverPoolHistory = async (driverId) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      driverId,
    },
  });

  if (!vehicle) {
    throw new AppError(
      "Driver does not have a vehicle",
      400
    );
  }

  return prisma.pool.findMany({
    where: {
      vehicleId: vehicle.id,
      status: {
        in: ["COMPLETED", "CANCELLED"],
      },
    },
    include: {
      vehicle: true,
      rideRequests: {
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          pickupLocation: true,
          destinationLocation: true,
          fare: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const calculateAndSavePoolFares = async ({
  tx,
  poolId,
}) => {
  const rides = await tx.rideRequest.findMany({
    where: {
      poolId,
      status: "MATCHED",
    },
    include: {
      pickupLocation: true,
      destinationLocation: true,
    },
    orderBy: {
      requestedAt: "asc",
    },
  });

  if (rides.length < 1 || rides.length > 3) {
    throw new AppError(
      "A pool must contain between 1 and 3 active passengers",
      400
    );
  }

  const passengers = rides.map((ride) => {
    const distanceKm = calculateDistanceKm(
      ride.pickupLocation.latitude,
      ride.pickupLocation.longitude,
      ride.destinationLocation.latitude,
      ride.destinationLocation.longitude
    );

    return {
      passengerId: ride.passengerId,
      distanceKm,
    };
  });

  const fareResult = calculatePoolFares(passengers);

  for (const fare of fareResult.fares) {
    const ride = rides.find(
      (ride) => ride.passengerId === fare.passengerId
    );

    if (!ride) {
      throw new AppError(
        "Could not find ride for passenger fare",
        500
      );
    }

    await tx.fare.upsert({
      where: {
        rideRequestId: ride.id,
      },
      update: {
        baseFare: 0,
        distanceCharge: fare.fare,
        poolDiscount: 0,
        total: fare.fare,
        paymentMethod: "CASH",
      },
      create: {
        rideRequestId: ride.id,
        baseFare: 0,
        distanceCharge: fare.fare,
        poolDiscount: 0,
        total: fare.fare,
        paymentMethod: "CASH",
      },
    });
  }

  return fareResult;
};