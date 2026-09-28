import {
  describe,
  it,
  expect,
} from "vitest";

import {
  calculatePoolFares,
} from "../../src/modules/fares/fare.service.js";

describe("calculatePoolFares", () => {
  it("calculates fare for 1 passenger", () => {
    const result = calculatePoolFares([
      {
        passengerId: "A",
        distanceKm: 12,
      },
    ]);

    expect(result).toEqual({
      passengerCount: 1,
      farePerKm: 10,
      totalFare: 120,
      fares: [
        {
          passengerId: "A",
          distanceKm: 12,
          fare: 120,
        },
      ],
    });
  });

  it("calculates fare for 2 passengers", () => {
    const result = calculatePoolFares([
      {
        passengerId: "A",
        distanceKm: 12,
      },
      {
        passengerId: "B",
        distanceKm: 10,
      },
    ]);

    expect(result).toEqual({
      passengerCount: 2,
      farePerKm: 10,
      totalFare: 120,
      fares: [
        {
          passengerId: "A",
          distanceKm: 12,
          fare: 70,
        },
        {
          passengerId: "B",
          distanceKm: 10,
          fare: 50,
        },
      ],
    });
  });

  it("calculates fare for 3 passengers", () => {
    const result = calculatePoolFares([
      {
        passengerId: "A",
        distanceKm: 12,
      },
      {
        passengerId: "B",
        distanceKm: 10,
      },
      {
        passengerId: "C",
        distanceKm: 8,
      },
    ]);

    expect(result).toEqual({
      passengerCount: 3,
      farePerKm: 10,
      totalFare: 120,
      fares: [
        {
          passengerId: "A",
          distanceKm: 12,
          fare: 57,
        },
        {
          passengerId: "B",
          distanceKm: 10,
          fare: 37,
        },
        {
          passengerId: "C",
          distanceKm: 8,
          fare: 26,
        },
      ],
    });
  });

  it("rejects more than 3 passengers", () => {
    expect(() =>
      calculatePoolFares([
        { passengerId: "A", distanceKm: 12 },
        { passengerId: "B", distanceKm: 10 },
        { passengerId: "C", distanceKm: 8 },
        { passengerId: "D", distanceKm: 5 },
      ])
    ).toThrow(
      "A pool must contain between 1 and 3 passengers"
    );
  });

  it("rejects zero or negative distance", () => {
    expect(() =>
      calculatePoolFares([
        {
          passengerId: "A",
          distanceKm: 0,
        },
      ])
    ).toThrow(
      "Passenger distance must be a positive number"
    );
  });
});