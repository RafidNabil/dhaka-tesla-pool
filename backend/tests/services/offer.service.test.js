import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    poolOffer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../../src/config/prisma.js", () => ({ prisma: prismaMock }));

import { acceptOffer } from "../../src/modules/offers/offer.service.js";
import { getOfferById, rejectOffer } from "../../src/modules/offers/offer.service.js";

describe("acceptOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects another offer while the driver has an active pool", async () => {
    const tx = {
      poolOffer: {
        findUnique: vi.fn().mockResolvedValue({
          id: "offer-2",
          poolId: "pool-2",
          driverId: "driver-1",
          status: "PENDING",
        }),
        updateMany: vi.fn(),
      },
      pool: {
        findFirst: vi.fn().mockResolvedValue({ id: "pool-1" }),
      },
      $queryRaw: vi.fn().mockResolvedValue([
        { id: "vehicle-1", online: true },
      ]),
    };

    prismaMock.$transaction.mockImplementation((callback) => callback(tx));

    await expect(
      acceptOffer({ offerId: "offer-2", driverId: "driver-1" })
    ).rejects.toThrow("You already have an active ride");

    expect(tx.pool.findFirst).toHaveBeenCalledWith({
      where: {
        vehicleId: "vehicle-1",
        status: { in: ["MATCHING", "CONFIRMED", "ACTIVE"] },
      },
    });
    expect(tx.poolOffer.updateMany).not.toHaveBeenCalled();
  });

  it("rejects the driver's other pending offers after acceptance", async () => {
    const offer = {
      id: "offer-1",
      poolId: "pool-1",
      driverId: "driver-1",
      status: "PENDING",
    };
    const tx = {
      poolOffer: {
        findUnique: vi.fn().mockResolvedValue(offer),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      pool: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      rideRequest: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ id: "vehicle-1", online: true }])
        .mockResolvedValueOnce([
          { id: "pool-1", vehicle_id: null, status: "MATCHING" },
        ]),
    };

    prismaMock.$transaction.mockImplementation((callback) => callback(tx));

    await acceptOffer({ offerId: offer.id, driverId: offer.driverId });

    expect(tx.poolOffer.updateMany).toHaveBeenCalledWith({
      where: {
        driverId: offer.driverId,
        status: "PENDING",
        id: { not: offer.id },
      },
      data: {
        status: "REJECTED",
        respondedAt: expect.any(Date),
      },
    });
  });
});

describe("offer read and rejection behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prevents a different driver from viewing an offer", async () => {
    prismaMock.poolOffer.findUnique.mockResolvedValue({
      id: "offer-1",
      driverId: "driver-1",
    });

    await expect(
      getOfferById({
        offerId: "offer-1",
        driverId: "driver-2",
      })
    ).rejects.toThrow("You are not authorized to view this offer");
  });

  it("rejects a pending offer and records the response time", async () => {
    prismaMock.poolOffer.findUnique.mockResolvedValue({
      id: "offer-1",
      driverId: "driver-1",
      status: "PENDING",
    });

    prismaMock.poolOffer.update.mockResolvedValue({
      status: "REJECTED",
    });

    await expect(
      rejectOffer({
        offerId: "offer-1",
        driverId: "driver-1",
      })
    ).resolves.toEqual({
      status: "REJECTED",
    });

    expect(prismaMock.poolOffer.update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: {
        status: "REJECTED",
        respondedAt: expect.any(Date),
      },
    });
  });
});