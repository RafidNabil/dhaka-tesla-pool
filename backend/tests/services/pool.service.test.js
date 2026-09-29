import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, emitToPoolMock } = vi.hoisted(() => ({
  prismaMock: { $transaction: vi.fn(), pool: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() }, rideRequest: { updateMany: vi.fn(), findMany: vi.fn() }, vehicle: { findUnique: vi.fn() }, fare: { upsert: vi.fn() } },
  emitToPoolMock: vi.fn(),
}));

vi.mock("../../src/config/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../../src/services/websocket.service.js", () => ({ emitToPool: emitToPoolMock }));

import { arriveAtPool, calculateAndSavePoolFares, completePool, startPool } from "../../src/modules/pools/pool.service.js";

describe("pool lifecycle service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts a confirmed pool and its matched rides", async () => {
    const tx = {
      pool: { findUnique: vi.fn().mockResolvedValue({ id: "pool-1", status: "CONFIRMED", vehicle: { driverId: "driver-1" } }), update: vi.fn().mockResolvedValue({ id: "pool-1", status: "ACTIVE" }) },
      rideRequest: { updateMany: vi.fn() },
    };
    prismaMock.$transaction.mockImplementation((callback) => callback(tx));

    await expect(startPool({ poolId: "pool-1", driverId: "driver-1" })).resolves.toEqual({ id: "pool-1", status: "ACTIVE" });
    expect(tx.rideRequest.updateMany).toHaveBeenCalledWith({ where: { poolId: "pool-1", status: "MATCHED" }, data: { status: "STARTED" } });
    expect(emitToPoolMock).toHaveBeenCalledTimes(2);
  });

  it("completes an active pool and its started rides", async () => {
    const tx = {
      pool: { findUnique: vi.fn().mockResolvedValue({ id: "pool-1", status: "ACTIVE", vehicle: { driverId: "driver-1" } }), update: vi.fn().mockResolvedValue({ id: "pool-1", status: "COMPLETED" }) },
      rideRequest: { updateMany: vi.fn() },
    };
    prismaMock.$transaction.mockImplementation((callback) => callback(tx));

    await completePool({ poolId: "pool-1", driverId: "driver-1" });
    expect(tx.rideRequest.updateMany).toHaveBeenCalledWith({ where: { poolId: "pool-1", status: "STARTED" }, data: { status: "COMPLETED" } });
  });

  it("rejects a pool start by the wrong driver", async () => {
    const tx = { pool: { findUnique: vi.fn().mockResolvedValue({ status: "CONFIRMED", vehicle: { driverId: "owner" } }) } };
    prismaMock.$transaction.mockImplementation((callback) => callback(tx));
    await expect(startPool({ poolId: "pool-1", driverId: "other" })).rejects.toThrow("You are not the driver assigned to this pool");
  });

  it("records a driver's arrival once", async () => {
    const updated = { id: "pool-1", driverArrivedAt: new Date() };
    const tx = { pool: { findUnique: vi.fn().mockResolvedValue({ status: "MATCHING", vehicle: { driverId: "driver-1" }, driverArrivedAt: null }), update: vi.fn().mockResolvedValue(updated) } };
    prismaMock.$transaction.mockImplementation((callback) => callback(tx));
    await expect(arriveAtPool({ poolId: "pool-1", driverId: "driver-1" })).resolves.toBe(updated);
    expect(emitToPoolMock).toHaveBeenCalledWith("pool-1", "pool:driverArrived", expect.objectContaining({ poolId: "pool-1" }));
  });

  it("persists calculated fares for matched rides", async () => {
    const tx = {
      rideRequest: {
        findMany: vi.fn().mockResolvedValue([{
          id: "ride-1",
          passengerId: "passenger-1",
          pickupLocation: { latitude: 23.746466, longitude: 90.376015 },
          destinationLocation: { latitude: 23.797911, longitude: 90.414391 },
        }]),
      },
      fare: { upsert: vi.fn().mockResolvedValue({}) },
    };

    const result = await calculateAndSavePoolFares({ tx, poolId: "pool-1" });
    expect(result.passengerCount).toBe(1);
    expect(tx.fare.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { rideRequestId: "ride-1" },
      create: expect.objectContaining({ paymentMethod: "CASH" }),
    }));
  });
});