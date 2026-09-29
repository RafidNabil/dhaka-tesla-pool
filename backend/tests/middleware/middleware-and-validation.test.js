import { describe, expect, it, vi } from "vitest";

const { verifyAccessTokenMock } = vi.hoisted(() => ({ verifyAccessTokenMock: vi.fn() }));
vi.mock("../../src/utils/jwt.js", () => ({ verifyAccessToken: verifyAccessTokenMock }));

import { authenticate, requireRole } from "../../src/middlewares/auth.middleware.js";
import { errorHandler } from "../../src/middlewares/error.middleware.js";
import { validate } from "../../src/middlewares/validate.middleware.js";
import { AppError } from "../../src/utils/errors.js";
import { createRideSchema } from "../../src/modules/rides/ride.validation.js";
import { registerSchema } from "../../src/modules/auth/auth.validation.js";

describe("middleware and validation", () => {
  it("authenticates a cookie token and assigns the user", () => {
    verifyAccessTokenMock.mockReturnValue({ sub: "user-1", role: "DRIVER" });
    const req = { cookies: { accessToken: "token" } };
    const next = vi.fn();
    authenticate(req, {}, next);
    expect(req.user).toEqual({ id: "user-1", role: "DRIVER" });
    expect(next).toHaveBeenCalledWith();
  });

  it("passes missing or invalid authentication to next as an error", () => {
    const next = vi.fn();
    authenticate({ cookies: {} }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ message: "Authentication required", statusCode: 401 });

    verifyAccessTokenMock.mockImplementation(() => { throw new Error("bad token"); });
    const invalidNext = vi.fn();
    authenticate({ cookies: { accessToken: "bad" } }, {}, invalidNext);
    expect(invalidNext.mock.calls[0][0]).toMatchObject({ message: "Invalid or expired access token", statusCode: 401 });
  });

  it("enforces roles and validates request bodies", () => {
    const next = vi.fn();
    requireRole("DRIVER")({ user: { role: "PASSENGER" } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });

    const validNext = vi.fn();
    const req = { body: { name: "  Alice ", email: "ALICE@EXAMPLE.COM", password: "password" } };
    validate(registerSchema)(req, {}, validNext);
    expect(req.body).toMatchObject({ name: "Alice", email: "alice@example.com" });
    expect(validNext).toHaveBeenCalledWith();
  });

  it("returns validation errors and AppErrors in the expected response shape", () => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    validate(createRideSchema)({ body: { seatsRequested: 0 } }, response, next);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Validation failed" }));

    const errorResponse = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    errorHandler(new AppError("Not found", 404), {}, errorResponse, vi.fn());
    expect(errorResponse.status).toHaveBeenCalledWith(404);
    expect(errorResponse.json).toHaveBeenCalledWith({ success: false, message: "Not found" });
  });

  it("rejects invalid schema values", () => {
    expect(registerSchema.safeParse({ name: "A", email: "bad", password: "short" }).success).toBe(false);
    expect(createRideSchema.safeParse({ pickupLocationId: "bad", destinationLocationId: "bad", seatsRequested: 4, poolingPreference: "WAIT" }).success).toBe(false);
  });
});