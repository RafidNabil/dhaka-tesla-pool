import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    location: { findMany: vi.fn(), findUnique: vi.fn() },
    vehicle: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("../../src/config/prisma.js", () => ({ prisma: prismaMock }));

import { getAllLocations, getLocationById } from "../../src/modules/locations/location.service.js";
import { getMyVehicle, updateVehicleStatus } from "../../src/modules/vehicles/vehicle.service.js";

describe("location and vehicle services", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists locations by name and rejects an unknown location", async () => {
    prismaMock.location.findMany.mockResolvedValue([{ id: "1", name: "A" }]);
    await expect(getAllLocations()).resolves.toEqual([{ id: "1", name: "A" }]);
    expect(prismaMock.location.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });

    prismaMock.location.findUnique.mockResolvedValue(null);
    await expect(getLocationById("missing")).rejects.toThrow("Location not found");
  });

  it("updates an existing vehicle status", async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue({ id: "vehicle-1", driverId: "driver-1" });
    prismaMock.vehicle.update.mockResolvedValue({ id: "vehicle-1", online: true });

    await expect(updateVehicleStatus({ driverId: "driver-1", online: true }))
      .resolves.toEqual({ id: "vehicle-1", online: true });
    expect(prismaMock.vehicle.update).toHaveBeenCalledWith({
      where: { id: "vehicle-1" },
      data: { online: true },
    });
  });

  it("rejects vehicle operations when the driver has no vehicle", async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue(null);
    await expect(getMyVehicle("driver-1")).rejects.toThrow("Driver does not have a vehicle");
    await expect(updateVehicleStatus({ driverId: "driver-1", online: false }))
      .rejects.toThrow("Driver does not have a vehicle");
  });
});