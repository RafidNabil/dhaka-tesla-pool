import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";

export const getOfferById = async ({
  offerId,
  driverId,
}) => {
  const offer = await prisma.poolOffer.findUnique({
    where: {
      id: offerId,
    },
    include: {
      pool: {
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
      },
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!offer) {
    throw new AppError("Pool offer not found", 404);
  }

  if (offer.driverId !== driverId) {
    throw new AppError(
      "You are not authorized to view this offer",
      403
    );
  }

  return offer;
};

export const getDriverOffers = async (driverId) => {
  return prisma.poolOffer.findMany({
    where: {
      driverId,
    },
    include: {
      pool: {
        include: {
          rideRequests: {
            include: {
              pickupLocation: true,
              destinationLocation: true,
            },
          },
        },
      },
    },
    orderBy: {
      offeredAt: "desc",
    },
  });
};

export const acceptOffer = async ({
  offerId,
  driverId,
}) => {
  return prisma.$transaction(
    async (tx) => {
      const offer = await tx.poolOffer.findUnique({
        where: {
          id: offerId,
        },
      });

      if (!offer) {
        throw new AppError("Pool offer not found", 404);
      }

      if (offer.driverId !== driverId) {
        throw new AppError(
          "You are not authorized to accept this offer",
          403
        );
      }

      const lockedVehicles = await tx.$queryRaw`
        SELECT id, online
        FROM vehicles
        WHERE driver_id = ${driverId}::uuid
        FOR UPDATE
      `;

      const vehicle = lockedVehicles[0];

      if (!vehicle) {
        throw new AppError(
          "Driver does not have a vehicle",
          400
        );
      }

      if (!vehicle.online) {
        throw new AppError(
          "Driver is currently offline",
          400
        );
      }

      const activePool = await tx.pool.findFirst({
        where: {
          vehicleId: vehicle.id,
          status: {
            in: ["MATCHING", "CONFIRMED", "ACTIVE"],
          },
        },
      });

      if (activePool) {
        throw new AppError(
          "You already have an active ride",
          400
        );
      }

      const lockedPools = await tx.$queryRaw`
        SELECT id, vehicle_id, status
        FROM pools
        WHERE id = ${offer.poolId}::uuid
        FOR UPDATE
      `;

      const pool = lockedPools[0];

      if (!pool) {
        throw new AppError("Pool not found", 404);
      }

      if (pool.status !== "MATCHING") {
        throw new AppError(
          "This pool is no longer available",
          400
        );
      }

      if (pool.vehicle_id) {
        throw new AppError(
          "This pool already has a driver",
          400
        );
      }

      if (offer.status !== "PENDING") {
        throw new AppError(
          "This offer is no longer pending",
          400
        );
      }

      const acceptedOffer = await tx.poolOffer.updateMany({
        where: {
          id: offerId,
          status: "PENDING",
        },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });

      if (acceptedOffer.count !== 1) {
        throw new AppError(
          "This offer is no longer pending",
          400
        );
      }

      await tx.pool.update({
        where: {
          id: offer.poolId,
        },
        data: {
          vehicleId: vehicle.id,
        },
      });

      await tx.poolOffer.updateMany({
        where: {
          poolId: offer.poolId,
          status: "PENDING",
          id: {
            not: offerId,
          },
        },
        data: {
          status: "REJECTED",
          respondedAt: new Date(),
        },
      });

      await tx.poolOffer.updateMany({
        where: {
          driverId,
          status: "PENDING",
          id: {
            not: offerId,
          },
        },
        data: {
          status: "REJECTED",
          respondedAt: new Date(),
        },
      });

      await tx.rideRequest.updateMany({
        where: {
          poolId: offer.poolId,
          status: "REQUESTED",
        },
        data: {
          status: "MATCHED",
        },
      });

      return tx.poolOffer.findUnique({
        where: {
          id: offerId,
        },
      });
    },
    {
      maxWait: 10000,
      timeout: 10000,
    }
  );
};


export const rejectOffer = async ({
  offerId,
  driverId,
}) => {
  const offer = await prisma.poolOffer.findUnique({
    where: {
      id: offerId,
    },
  });

  if (!offer) {
    throw new AppError("Pool offer not found", 404);
  }

  if (offer.driverId !== driverId) {
    throw new AppError(
      "You are not authorized to reject this offer",
      403
    );
  }

  if (offer.status !== "PENDING") {
    throw new AppError(
      "This offer is no longer pending",
      400
    );
  }

  return prisma.poolOffer.update({
    where: {
      id: offerId,
    },
    data: {
      status: "REJECTED",
      respondedAt: new Date(),
    },
  });
};