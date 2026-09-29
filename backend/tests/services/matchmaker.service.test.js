import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    user: {
      findMany: vi.fn(),
    },
    poolOffer: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock("../../src/config/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../../src/modules/pools/pool.matching.js", () => ({
  findCompatiblePool: vi.fn(),
}));
vi.mock("../../src/modules/pools/pool.service.js", () => ({
  calculateAndSavePoolFares: vi.fn(),
}));
vi.mock("../../src/services/websocket.service.js", () => ({
  emitToPool: vi.fn(),
}));

import { findCompatiblePool } from "../../src/modules/pools/pool.matching.js";
import { processRideRequest } from "../../src/services/matchmaker/matchmaker.service.js";

describe("processRideRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("only creates offers for drivers without an active pool", async () => {
    const rideRequest = {
      id: "ride-1",
      status: "REQUESTED",
      seatsRequested: 1,
      pickupLocation: {},
      destinationLocation: {},
    };
    const tx = {
      rideRequest: {
        findUnique: vi.fn().mockResolvedValue(rideRequest),
      },
      pool: {
        create: vi.fn().mockResolvedValue({
          id: "pool-1",
          vehicleId: null,
        }),
      },
    };

    findCompatiblePool.mockResolvedValue(null);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.$transaction.mockImplementation((callback) => callback(tx));

    await processRideRequest(rideRequest.id);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {
        role: "DRIVER",
        vehicle: {
          is: {
            online: true,
            pools: {
              none: {
                status: {
                  in: ["MATCHING", "CONFIRMED", "ACTIVE"],
                },
              },
            },
          },
        },
      },
      include: { vehicle: true },
    });
  });

  it("matches a ride added to a pool that already has a driver", async () => {
    const assignedPool = {
      id: "pool-1",
      vehicleId: "vehicle-1",
    };
    const rideRequest = {
      id: "ride-2",
      status: "REQUESTED",
      seatsRequested: 1,
      pickupLocation: {},
      destinationLocation: {},
    };
    const tx = {
      rideRequest: {
        findUnique: vi.fn().mockResolvedValue(rideRequest),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      pool: {
        update: vi.fn().mockResolvedValue(assignedPool),
      },
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: "pool-1",
          seats_occupied: 1,
          status: "MATCHING",
          vehicle_id: "vehicle-1",
        },
      ]),
      user: {
        findMany: vi.fn(),
      },
    };

    findCompatiblePool.mockResolvedValue(assignedPool);
    prismaMock.$transaction.mockImplementation((callback) => callback(tx));

    await processRideRequest(rideRequest.id);

    expect(tx.rideRequest.updateMany).toHaveBeenCalledWith({
      where: { id: rideRequest.id, status: "REQUESTED" },
      data: { status: "MATCHED" },
    });
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });
});