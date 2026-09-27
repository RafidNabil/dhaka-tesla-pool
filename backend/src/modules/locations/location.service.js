import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";

export const getAllLocations = async () => {
  return prisma.location.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

export const getLocationById = async (id) => {
  const location = await prisma.location.findUnique({
    where: { id },
  });

  if (!location) {
    throw new AppError("Location not found", 404);
  }

  return location;
};