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