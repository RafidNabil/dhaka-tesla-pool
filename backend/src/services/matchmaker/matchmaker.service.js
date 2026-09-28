import { prisma } from "../../config/prisma.js";
import { findCompatiblePool } from "../../modules/pools/pool.matching.js";
import { emitToPool } from "../../services/websocket.service.js";
import { calculateAndSavePoolFares } from "../../modules/pools/pool.service.js";

const findAvailableDrivers = async (tx) => {
  return tx.user.findMany({
    where: {
      role: "DRIVER",
      vehicle: {
        online: true,
      },
    },
    include: {
      vehicle: true,
    },
  });
};

const createPool = async ({
  tx,
  rideRequest,
}) => {
  return tx.pool.create({
    data: {
      status: "MATCHING",
      seatsOccupied: rideRequest.seatsRequested,
      rideRequests: {
        connect: {
          id: rideRequest.id,
        },
      },
    },
  });
};

const addRideToPool = async ({
  tx,
  pool,
  rideRequest,
}) => {
  const lockedPools = await tx.$queryRaw`
    SELECT id, seats_occupied, status
    FROM pools
    WHERE id = ${pool.id}::uuid
    FOR UPDATE
  `;

  const lockedPool = lockedPools[0];

  if (!lockedPool) {
    return null;
  }

  if (lockedPool.status !== "MATCHING") {
    return null;
  }

  const newSeats =
    Number(lockedPool.seats_occupied) +
    rideRequest.seatsRequested;

  if (newSeats > 3) {
    return null;
  }

  return tx.pool.update({
    where: {
      id: pool.id,
    },
    data: {
      seatsOccupied: newSeats,
      rideRequests: {
        connect: {
          id: rideRequest.id,
        },
      },
    },
  });
};

const createPoolOffers = async ({
  tx,
  poolId,
}) => {
  const drivers = await findAvailableDrivers(tx);

  for (const driver of drivers) {
    await tx.poolOffer.upsert({
      where: {
        poolId_driverId: {
          poolId,
          driverId: driver.id,
        },
      },
      update: {},
      create: {
        poolId,
        driverId: driver.id,
        status: "PENDING",
      },
    });
  }

  return drivers.length;
};

const getPoolReadiness = async ({
  tx,
  poolId,
}) => {
  const rides = await tx.rideRequest.findMany({
    where: {
      poolId,
      status: {
        not: "CANCELLED",
      },
    },
    select: {
      seatsRequested: true,
      poolingPreference: true,
    },
  });

  let immediateSeats = 0;
  let waitSeats = 0;

  for (const ride of rides) {
    if (ride.poolingPreference === "IMMEDIATE") {
      immediateSeats += ride.seatsRequested;
    } else {
      waitSeats += ride.seatsRequested;
    }
  }

  return {
    immediateSeats,
    waitSeats,
    readyToProceed: immediateSeats > waitSeats,
  };
};

const confirmReadyPools = async () => {
  return prisma.$transaction(async (tx) => {
    const pools = await tx.pool.findMany({
      where: {
        status: "MATCHING",
        vehicleId: { not: null },
      },
      select: {
        id: true,
      },
    });

    const confirmedPools = [];

    for (const pool of pools) {
      const readiness = await getPoolReadiness({
        tx,
        poolId: pool.id,
      });

      if (!readiness.readyToProceed) {
        continue;
      }

      /*
       * Calculate and save passenger fares before
       * allowing the pool to become CONFIRMED.
       */
      const fareResult =
        await calculateAndSavePoolFares({
          tx,
          poolId: pool.id,
        });

      const updatedPool = await tx.pool.updateMany({
        where: {
          id: pool.id,
          status: "MATCHING",
          vehicleId: { not: null },
        },
        data: {
          status: "CONFIRMED",
        },
      });

      if (updatedPool.count === 1) {
        confirmedPools.push({
          poolId: pool.id,
          immediateSeats: readiness.immediateSeats,
          waitSeats: readiness.waitSeats,
          totalFare: fareResult.totalFare,
          fares: fareResult.fares,
        });
      }
    }

    return confirmedPools;
  });
};

export const processRideRequest = async (rideRequestId) => {
  return prisma.$transaction(async (tx) => {
    const rideRequest = await tx.rideRequest.findUnique({
      where: {
        id: rideRequestId,
      },
      include: {
        pickupLocation: true,
        destinationLocation: true,
      },
    });

    if (!rideRequest || rideRequest.status !== "REQUESTED") {
      return null;
    }

    const compatiblePool = await findCompatiblePool({
      tx,
      pickupLocation: rideRequest.pickupLocation,
      destinationLocation: rideRequest.destinationLocation,
      seatsRequested: rideRequest.seatsRequested,
    });

    let pool;

    if (compatiblePool) {
      pool = await addRideToPool({
        tx,
        pool: compatiblePool,
        rideRequest,
      });
    }

    // The pool may have become full between
    // findCompatiblePool() and the row lock.
    //
    // In that case, create a new pool instead.
    if (!pool) {
      pool = await createPool({
        tx,
        rideRequest,
      });
    }

    const offerCount = await createPoolOffers({
      tx,
      poolId: pool.id,
    });

    return {
      rideRequestId: rideRequest.id,
      poolId: pool.id,
      offerCount,
    };
  });
};

export const processRequestedRides = async () => {
  const rideRequests = await prisma.rideRequest.findMany({
    where: {
      status: "REQUESTED",
      poolId: null,
    },
    orderBy: {
      requestedAt: "asc",
    },
    select: {
      id: true,
    },
  });

  const results = [];

  for (const rideRequest of rideRequests) {
    const result = await processRideRequest(rideRequest.id);

    if (result) {
      results.push(result);
    }
  }

  return results;
};

export const processMatchingPools = async () => {
  return prisma.$transaction(async (tx) => {
    const pools = await tx.pool.findMany({
      where: {
        status: "MATCHING",
      },
      select: {
        id: true,
        vehicleId: true,
      },
    });

    const results = [];

    for (const pool of pools) {
      if (pool.vehicleId) {
        continue;
      }

      const offerCount = await createPoolOffers({
        tx,
        poolId: pool.id,
      });

      results.push({
        poolId: pool.id,
        vehicleAssigned: false,
        offerCount,
      });
    }

    return results;
  });
};

export const processPoolReadiness = async () => {
  return confirmReadyPools();
};

export const runMatchmakingCycle = async () => {
  const requestedRides = await processRequestedRides();

  const matchingPools = await processMatchingPools();

  const confirmedPools = await processPoolReadiness();

  return {
    requestedRides,
    matchingPools,
    confirmedPools,
  };
};
