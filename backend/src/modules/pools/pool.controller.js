import * as poolService from "./pool.service.js";

export const getPoolById = async (req, res, next) => {
  try {
    const pool = await poolService.getPoolById(req.params.id);

    res.status(200).json({
      success: true,
      pool,
    });
  } catch (error) {
    next(error);
  }
};

export const getMatchingPools = async (req, res, next) => {
  try {
    const pools = await poolService.getMatchingPools();

    res.status(200).json({
      success: true,
      pools,
    });
  } catch (error) {
    next(error);
  }
};

export const arriveAtPool = async (req, res, next) => {
  try {
    const pool = await poolService.arriveAtPool({
      poolId: req.params.id,
      driverId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Driver arrival recorded successfully",
      pool,
    });
  } catch (error) {
    next(error);
  }
};

export const startPool = async (req, res, next) => {
  try {
    const pool = await poolService.startPool({
      poolId: req.params.id,
      driverId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Pool started successfully",
      pool,
    });
  } catch (error) {
    next(error);
  }
};

export const completePool = async (req, res, next) => {
  try {
    const pool = await poolService.completePool({
      poolId: req.params.id,
      driverId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Pool completed successfully",
      pool,
    });
  } catch (error) {
    next(error);
  }
};