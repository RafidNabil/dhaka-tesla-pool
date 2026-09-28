import { AppError } from "../../utils/errors.js";

const FARE_PER_KM = 10;
const MAX_PASSENGERS = 3;

export const calculatePoolFares = (passengers) => {
  if (!Array.isArray(passengers)) {
    throw new AppError("Passengers must be an array", 400);
  }

  if (
    passengers.length < 1 ||
    passengers.length > MAX_PASSENGERS
  ) {
    throw new AppError(
      "A pool must contain between 1 and 3 passengers",
      400
    );
  }

  for (const passenger of passengers) {
    if (!passenger.passengerId) {
      throw new AppError(
        "Passenger ID is required",
        400
      );
    }

    if (
      typeof passenger.distanceKm !== "number" ||
      !Number.isFinite(passenger.distanceKm) ||
      passenger.distanceKm <= 0
    ) {
      throw new AppError(
        "Passenger distance must be a positive number",
        400
      );
    }
  }

  const passengerData = passengers.map(
    (passenger, index) => ({
      passengerId: passenger.passengerId,
      distanceKm: passenger.distanceKm,
      remainingDistanceKm: passenger.distanceKm,
      exactFare: 0,
      index,
    })
  );

  // Distribute the fare progressively.
  while (
    passengerData.some(
      (passenger) =>
        passenger.remainingDistanceKm > 0
    )
  ) {
    const activePassengers =
      passengerData.filter(
        (passenger) =>
          passenger.remainingDistanceKm > 0
      );

    const shortestRemainingDistance =
      Math.min(
        ...activePassengers.map(
          (passenger) =>
            passenger.remainingDistanceKm
        )
      );

    const segmentFare =
      shortestRemainingDistance * FARE_PER_KM;

    const farePerPassenger =
      segmentFare / activePassengers.length;

    for (const passenger of activePassengers) {
      passenger.exactFare += farePerPassenger;
      passenger.remainingDistanceKm -=
        shortestRemainingDistance;

      if (
        Math.abs(
          passenger.remainingDistanceKm
        ) < 0.000001
      ) {
        passenger.remainingDistanceKm = 0;
      }
    }
  }

  /*
   * The total pool fare is the fare for the
   * longest passenger distance.
   *
   * Example:
   * 12 km, 10 km, 8 km
   * Total = 12 × 10 = ৳120
   */
  const longestDistance = Math.max(
    ...passengerData.map(
      (passenger) => passenger.distanceKm
    )
  );

  const totalFare = Math.round(
    longestDistance * FARE_PER_KM
  );

  /*
   * Convert exact fares to whole taka while
   * ensuring the individual fares still add
   * up exactly to the total pool fare.
   */
  const roundedFares = passengerData.map(
    (passenger) => ({
      passengerId: passenger.passengerId,
      distanceKm: Number(
        passenger.distanceKm.toFixed(2)
      ),
      exactFare: passenger.exactFare,
      fare: Math.floor(passenger.exactFare),
      fraction:
        passenger.exactFare -
        Math.floor(passenger.exactFare),
      index: passenger.index,
    })
  );

  let roundedTotal = roundedFares.reduce(
    (total, passenger) =>
      total + passenger.fare,
    0
  );

  const remainingTaka =
    totalFare - roundedTotal;

  /*
   * Give remaining taka to passengers with
   * the largest fractional amounts.
   */
  roundedFares.sort(
    (a, b) =>
      b.fraction - a.fraction ||
      a.index - b.index
  );

  for (let i = 0; i < remainingTaka; i++) {
    roundedFares[i].fare += 1;
  }

  // Restore original passenger order.
  roundedFares.sort(
    (a, b) => a.index - b.index
  );

  return {
    passengerCount: passengers.length,
    farePerKm: FARE_PER_KM,
    totalFare,
    fares: roundedFares.map(
      (passenger) => ({
        passengerId: passenger.passengerId,
        distanceKm: passenger.distanceKm,
        fare: passenger.fare,
      })
    ),
  };
};