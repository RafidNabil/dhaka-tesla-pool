import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";

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