import { describe, expect, it, vi } from "vitest";
import { findCompatiblePool } from "../../src/modules/pools/pool.matching.js";

const location = (latitude, longitude) => ({ latitude, longitude });

describe("findCompatiblePool", () => {
  it("returns the oldest compatible pool with enough seats", async () => {
    const compatiblePool = {
      id: "pool-1",
      seatsOccupied: 1,
      rideRequests: [{
        pickupLocation: location(23.746466, 90.376015),
        destinationLocation: location(23.797911, 90.414391),
      }],
    };
    const tx = {
      pool: {
        findMany: vi.fn().mockResolvedValue([compatiblePool]),
      },
    };

    await expect(findCompatiblePool({
      tx,
      pickupLocation: location(23.7465, 90.3760),
      destinationLocation: location(23.7980, 90.4144),
      seatsRequested: 1,
    })).resolves.toBe(compatiblePool);
  });

  it("skips pools that are full or have no active ride", async () => {
    const tx = {
      pool: {
        findMany: vi.fn().mockResolvedValue([
          { id: "full", seatsOccupied: 3, rideRequests: [] },
          { id: "empty", seatsOccupied: 0, rideRequests: [] },
        ]),
      },
    };

    await expect(findCompatiblePool({
      tx,
      pickupLocation: location(0, 0),
      destinationLocation: location(1, 1),
      seatsRequested: 1,
    })).resolves.toBeNull();
  });

  it("returns null when pickup or destination is outside the matching limits", async () => {
    const tx = {
      pool: {
        findMany: vi.fn().mockResolvedValue([{
          id: "pool-1",
          seatsOccupied: 0,
          rideRequests: [{
            pickupLocation: location(23.746466, 90.376015),
            destinationLocation: location(23.797911, 90.414391),
          }],
        }]),
      },
    };

    await expect(findCompatiblePool({
      tx,
      pickupLocation: location(24, 91),
      destinationLocation: location(23.797911, 90.414391),
      seatsRequested: 1,
    })).resolves.toBeNull();
  });
});