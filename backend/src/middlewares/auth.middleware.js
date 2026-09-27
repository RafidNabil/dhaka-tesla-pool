import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";

export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError("Invalid or expired access token", 401));
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("You are not authorized to perform this action", 403));
    }

    next();
  };
};
