import { describe, expect, it, vi } from "vitest";

const { signMock, verifyMock, hashMock, compareMock } = vi.hoisted(() => ({
  signMock: vi.fn(),
  verifyMock: vi.fn(),
  hashMock: vi.fn(),
  compareMock: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({ default: { sign: signMock, verify: verifyMock } }));
vi.mock("bcryptjs", () => ({ default: { hash: hashMock, compare: compareMock } }));
vi.mock("../../src/config/env.js", () => ({
  env: { JWT_ACCESS_SECRET: "test-secret", JWT_ACCESS_EXPIRES_IN: "1h", BCRYPT_SALT_ROUNDS: 10 },
}));

import { AppError } from "../../src/utils/errors.js";
import { generateAccessToken, verifyAccessToken } from "../../src/utils/jwt.js";
import { comparePassword, hashPassword } from "../../src/utils/password.js";

describe("utility functions", () => {
  it("generates and verifies access tokens with the configured secret", () => {
    signMock.mockReturnValue("token");
    verifyMock.mockReturnValue({ sub: "user-1", role: "PASSENGER" });

    expect(generateAccessToken({ id: "user-1", role: "PASSENGER" })).toBe("token");
    expect(signMock).toHaveBeenCalledWith({ sub: "user-1", role: "PASSENGER" }, "test-secret", { expiresIn: "1h" });
    expect(verifyAccessToken("token")).toEqual({ sub: "user-1", role: "PASSENGER" });
    expect(verifyMock).toHaveBeenCalledWith("token", "test-secret");
  });

  it("delegates password hashing and comparison", async () => {
    hashMock.mockResolvedValue("hash");
    compareMock.mockResolvedValue(true);
    await expect(hashPassword("password")).resolves.toBe("hash");
    await expect(comparePassword("password", "hash")).resolves.toBe(true);
    expect(hashMock).toHaveBeenCalledWith("password", 10);
    expect(compareMock).toHaveBeenCalledWith("password", "hash");
  });

  it("preserves AppError messages and status codes", () => {
    const error = new AppError("Bad request", 400);
    expect(error).toMatchObject({ name: "AppError", message: "Bad request", statusCode: 400 });
  });
});