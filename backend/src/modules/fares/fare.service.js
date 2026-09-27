import { AppError } from "../../utils/errors.js";
import { calculateDistanceKm } from "../../services/distance.service.js";

const FARE_PER_KM = 5;

export const calculateFare = ({
  pickupLatitude,
  pickupLongitude,
  destinationLatitude,
  destinationLongitude,
}) => {
  const distanceKm = calculateDistanceKm(
    pickupLatitude,
    pickupLongitude,
    destinationLatitude,
    destinationLongitude
  );

  const total = Math.ceil(distanceKm * FARE_PER_KM);

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    fare: total,
  };
};

export const calculateFareForLocations = ({
  pickupLocation,
  destinationLocation,
}) => {
  if (!pickupLocation || !destinationLocation) {
    throw new AppError("Pickup and destination locations are required", 400);
  }

  return calculateFare({
    pickupLatitude: pickupLocation.latitude,
    pickupLongitude: pickupLocation.longitude,
    destinationLatitude: destinationLocation.latitude,
    destinationLongitude: destinationLocation.longitude,
  });
};