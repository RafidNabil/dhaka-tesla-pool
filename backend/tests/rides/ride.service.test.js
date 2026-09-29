import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, emitToPoolMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    location: {
      findUnique: vi.fn(),
    },
    rideRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  emitToPoolMock: vi.fn(),
}));

vi.mock("../../src/config/prisma.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../../src/services/websocket.service.js", () => ({
  emitToPool: emitToPoolMock,
}));

import {
  cancelRide,
  createRide,
  updatePoolingPreference,
} from "../../src/modules/rides/ride.service.js";

describe("createRide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects identical pickup and destination locations", async () => {
    await expect(
      createRide({
        passengerId: "passenger-1",
        pickupLocationId: "location-1",
        destinationLocationId: "location-1",
        seatsRequested: 1,
        poolingPreference: "MUST_POOL",
      })
    ).rejects.toThrow("Pickup and destination cannot be the same");

    expect(prismaMock.location.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.rideRequest.create).not.toHaveBeenCalled();
  });

  it("rejects a ride when the pickup location does not exist", async () => {
    prismaMock.location.findUnique.mockResolvedValue(null);

    await expect(
      createRide({
        passengerId: "passenger-1",
        pickupLocationId: "pickup-1",
        destinationLocationId: "destination-1",
        seatsRequested: 1,
        poolingPreference: "MUST_POOL",
      })
    ).rejects.toThrow("Pickup location not found");

    expect(prismaMock.location.findUnique).toHaveBeenCalledWith({
      where: { id: "pickup-1" },
    });
    expect(prismaMock.rideRequest.create).not.toHaveBeenCalled();
  });

  it("creates a requested ride after validating both locations", async () => {
    const pickupLocation = { id: "pickup-1", name: "Pickup" };
    const destinationLocation = {
      id: "destination-1",
      name: "Destination",
    };
    const ride = { id: "ride-1", status: "REQUESTED" };

    prismaMock.location.findUnique
      .mockResolvedValueOnce(pickupLocation)
      .mockResolvedValueOnce(destinationLocation);
    prismaMock.rideRequest.create.mockResolvedValue(ride);

    await expect(
      createRide({
        passengerId: "passenger-1",
        pickupLocationId: pickupLocation.id,
        destinationLocationId: destinationLocation.id,
        seatsRequested: 2,
        poolingPreference: "PREFER_POOL",
      })
    ).resolves.toBe(ride);

    expect(prismaMock.rideRequest.create).toHaveBeenCalledWith({
      data: {
        passengerId: "passenger-1",
        pickupLocationId: pickupLocation.id,
        destinationLocationId: destinationLocation.id,
        seatsRequested: 2,
        poolingPreference: "PREFER_POOL",
        status: "REQUESTED",
        poolId: null,
      },
      include: {
        pickupLocation: true,
        destinationLocation: true,
      },
    });
  });
});

describe("updatePoolingPreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects updates from a passenger who does not own the ride", async () => {
    prismaMock.rideRequest.findUnique.mockResolvedValue({
      id: "ride-1",
      passengerId: "passenger-1",
      status: "REQUESTED",
      poolingPreference: "MUST_POOL",
    });

    await expect(
      updatePoolingPreference({
        rideId: "ride-1",
        passengerId: "passenger-2",
        poolingPreference: "PREFER_POOL",
      })
    ).rejects.toThrow("You are not authorized to update this ride");

    expect(prismaMock.rideRequest.update).not.toHaveBeenCalled();
  });

  it("updates a preference and notifies an assigned pool", async () => {
    prismaMock.rideRequest.findUnique.mockResolvedValue({
      id: "ride-1",
      passengerId: "passenger-1",
      status: "MATCHED",
      poolingPreference: "MUST_POOL",
    });
    prismaMock.rideRequest.update.mockResolvedValue({
      id: "ride-1",
      poolId: "pool-1",
      poolingPreference: "PREFER_POOL",
    });

    await updatePoolingPreference({
      rideId: "ride-1",
      passengerId: "passenger-1",
      poolingPreference: "PREFER_POOL",
    });

    expect(emitToPoolMock).toHaveBeenCalledWith(
      "pool-1",
      "ride:preferenceUpdated",
      {
        rideId: "ride-1",
        poolingPreference: "PREFER_POOL",
      }
    );
  });
});

describe("cancelRide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels the pool when the ride is its last active ride", async () => {
    const ride = {
      id: "ride-1",
      passengerId: "passenger-1",
      poolId: "pool-1",
      seatsRequested: 1,
      status: "MATCHED",
    };
    const tx = {
      rideRequest: {
        update: vi.fn().mockResolvedValue({
          ...ride,
          status: "CANCELLED",
        }),
        count: vi.fn().mockResolvedValue(0),
      },
      pool: {
        update: vi.fn().mockResolvedValue({}),
      },
    };

    prismaMock.rideRequest.findUnique.mockResolvedValue(ride);
    prismaMock.$transaction.mockImplementation((callback) => callback(tx));

    await cancelRide({
      rideId: ride.id,
      passengerId: ride.passengerId,
    });

    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: ride.poolId },
      data: {
        status: "CANCELLED",
        seatsOccupied: 0,
      },
    });
    expect(emitToPoolMock).toHaveBeenCalledWith(
      ride.poolId,
      "pool:statusChanged",
      { poolId: ride.poolId, status: "CANCELLED" }
    );
  });

  it("rejects cancellation after a ride has started", async () => {
    prismaMock.rideRequest.findUnique.mockResolvedValue({
      id: "ride-1",
      passengerId: "passenger-1",
      poolId: null,
      status: "STARTED",
    });

    await expect(
      cancelRide({
        rideId: "ride-1",
        passengerId: "passenger-1",
      })
    ).rejects.toThrow("Ride cannot be cancelled in its current state");

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});