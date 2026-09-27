import { describe, expect, it } from "vitest";
import { calculateDistanceKm } from "../../src/services/distance.service.js";

describe("calculateDistanceKm", () => {
  it("returns 0 for the same location", () => {
    const distance = calculateDistanceKm(
      23.746466,
      90.376015,
      23.746466,
      90.376015
    );

    expect(distance).toBe(0);
  });

  it("calculates the distance between two locations", () => {
    const distance = calculateDistanceKm(
      23.746466,
      90.376015,
      23.797911,
      90.414391
    );

    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(10);
  });

  it("returns the same distance regardless of direction", () => {
    const distance1 = calculateDistanceKm(
      23.746466,
      90.376015,
      23.797911,
      90.414391
    );

    const distance2 = calculateDistanceKm(
      23.797911,
      90.414391,
      23.746466,
      90.376015
    );

    expect(distance1).toBeCloseTo(distance2, 10);
  });

  it("accepts coordinate values provided as strings", () => {
    const distance = calculateDistanceKm(
      "23.746466",
      "90.376015",
      "23.797911",
      "90.414391"
    );

    expect(distance).toBeGreaterThan(0);
  });
});