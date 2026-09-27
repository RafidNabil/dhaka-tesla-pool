import { calculateDistanceKm } from "../../services/distance.service.js";

const MAX_PICKUP_DISTANCE_KM = 1;
const MAX_DESTINATION_DISTANCE_KM = 3;
const VEHICLE_CAPACITY = 3;

export const findCompatiblePool = async ({
  tx,
  pickupLocation,
  destinationLocation,
  seatsRequested,
}) => {
  const pools = await tx.pool.findMany({
    where: {
      status: "MATCHING",
    },
    include: {
      rideRequests: {
        where: {
          status: {
            not: "CANCELLED",
          },
        },
        include: {
          pickupLocation: true,
          destinationLocation: true,
        },
        orderBy: {
          requestedAt: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  for (const pool of pools) {
    const remainingSeats =
      VEHICLE_CAPACITY - pool.seatsOccupied;

    if (remainingSeats < seatsRequested) {
      continue;
    }

    const firstRide = pool.rideRequests[0];

    if (!firstRide) {
      continue;
    }

    const pickupDistance = calculateDistanceKm(
      pickupLocation.latitude,
      pickupLocation.longitude,
      firstRide.pickupLocation.latitude,
      firstRide.pickupLocation.longitude
    );

    const destinationDistance = calculateDistanceKm(
      destinationLocation.latitude,
      destinationLocation.longitude,
      firstRide.destinationLocation.latitude,
      firstRide.destinationLocation.longitude
    );

    if (
      pickupDistance <= MAX_PICKUP_DISTANCE_KM &&
      destinationDistance <= MAX_DESTINATION_DISTANCE_KM
    ) {
      return pool;
    }
  }

  return null;
};