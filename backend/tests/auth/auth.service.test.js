import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, hashPasswordMock, comparePasswordMock, tokenMock } =
  vi.hoisted(() => ({
    prismaMock: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
    hashPasswordMock: vi.fn(),
    comparePasswordMock: vi.fn(),
    tokenMock: vi.fn(),
  }));

vi.mock("../../src/config/prisma.js", () => ({ prisma: prismaMock }));
vi.mock("../../src/utils/password.js", () => ({
  hashPassword: hashPasswordMock,
  comparePassword: comparePasswordMock,
}));
vi.mock("../../src/utils/jwt.js", () => ({
  generateAccessToken: tokenMock,
}));

import {
  getCurrentUser,
  login,
  register,
} from "../../src/modules/auth/auth.service.js";

describe("auth service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects registration for an existing email", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "user-1" });

    await expect(
      register({ name: "A Passenger", email: "a@example.com", password: "password" })
    ).rejects.toThrow("Email is already registered");
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("registers a passenger with a hashed password and token", async () => {
    const user = { id: "user-1", name: "Passenger", email: "a@example.com", role: "PASSENGER" };
    prismaMock.user.findUnique.mockResolvedValue(null);
    hashPasswordMock.mockResolvedValue("hashed");
    prismaMock.user.create.mockResolvedValue(user);
    tokenMock.mockReturnValue("token");

    await expect(
      register({ name: user.name, email: user.email, password: "password" })
    ).resolves.toEqual({ user, accessToken: "token" });

    expect(prismaMock.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ passwordHash: "hashed", role: "PASSENGER" }),
    }));
  });

  it("rejects login with an unknown user or wrong password", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(login({ email: "a@example.com", password: "wrong" }))
      .rejects.toThrow("Invalid email or password");

    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: "hash" });
    comparePasswordMock.mockResolvedValue(false);
    await expect(login({ email: "a@example.com", password: "wrong" }))
      .rejects.toThrow("Invalid email or password");
  });

  it("returns only the safe current-user fields", async () => {
    const user = { id: "user-1", name: "Passenger", email: "a@example.com", role: "PASSENGER" };
    prismaMock.user.findUnique.mockResolvedValue(user);

    await expect(getCurrentUser(user.id)).resolves.toEqual(user);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true },
    }));
  });
});