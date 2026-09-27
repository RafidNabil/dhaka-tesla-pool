import * as authService from "./auth.service.js";
import { env } from "../../config/env.js";

const setAccessTokenCookie = (res, accessToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });
};

export const register = async (req, res, next) => {
  try {
    const { user, accessToken } = await authService.register(req.body);

    setAccessTokenCookie(res, accessToken);

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, accessToken } = await authService.login(req.body);

    setAccessTokenCookie(res, accessToken);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};