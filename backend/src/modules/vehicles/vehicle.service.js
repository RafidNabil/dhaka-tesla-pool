import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";

export const updateVehicleStatus = async ({
  driverId,
  online,
}) => {
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

  return prisma.vehicle.update({
    where: {
      id: vehicle.id,
    },
    data: {
      online,
    },
  });
};

export const getMyVehicle = async (driverId) => {
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

  return vehicle;
};