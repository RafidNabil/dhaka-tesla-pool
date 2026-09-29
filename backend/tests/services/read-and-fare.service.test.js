import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    pool: { findUnique: vi.fn(), findMany: vi.fn() },
    rideRequest: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    vehicle: { findUnique: vi.fn() },
  },
}));

vi.mock("../../src/config/prisma.js", () => ({ prisma: prismaMock }));

import { getActiveRide, getPassengerRideHistory, getRideById } from "../../src/modules/rides/ride.service.js";
import { getDriverPoolHistory, getMatchingPools, getPoolById } from "../../src/modules/pools/pool.service.js";

describe("ride and pool read services", () => {
  beforeEach(() => vi.clearAllMocks());

  it("only returns a ride to its passenger", async () => {
    prismaMock.rideRequest.findUnique.mockResolvedValue({ id: "ride-1", passengerId: "passenger-1" });
    await expect(getRideById({ rideId: "ride-1", passengerId: "passenger-2" }))
      .rejects.toThrow("You are not authorized to view this ride");
  });

  it("queries passenger history and the latest active ride", async () => {
    prismaMock.rideRequest.findMany.mockResolvedValue([]);
    prismaMock.rideRequest.findFirst.mockResolvedValue(null);

    await expect(getPassengerRideHistory("passenger-1")).resolves.toEqual([]);
    await expect(getActiveRide("passenger-1")).resolves.toBeNull();
    expect(prismaMock.rideRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { passengerId: "passenger-1", status: { in: ["COMPLETED", "CANCELLED"] } },
      orderBy: { requestedAt: "desc" },
    }));
    expect(prismaMock.rideRequest.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { passengerId: "passenger-1", status: { in: ["REQUESTED", "MATCHED", "STARTED"] } },
    }));
  });

  it("rejects missing pools and lists matching pools", async () => {
    prismaMock.pool.findUnique.mockResolvedValue(null);
    await expect(getPoolById("pool-missing")).rejects.toThrow("Pool not found");

    prismaMock.pool.findMany.mockResolvedValue([]);
    await expect(getMatchingPools()).resolves.toEqual([]);
    expect(prismaMock.pool.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "MATCHING" },
      orderBy: { createdAt: "asc" },
    }));
  });

  it("returns driver history only for a driver's vehicle", async () => {
    prismaMock.vehicle.findUnique.mockResolvedValue({ id: "vehicle-1" });
    prismaMock.pool.findMany.mockResolvedValue([]);

    await expect(getDriverPoolHistory("driver-1")).resolves.toEqual([]);
    expect(prismaMock.pool.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { vehicleId: "vehicle-1", status: { in: ["COMPLETED", "CANCELLED"] } },
    }));
  });
});