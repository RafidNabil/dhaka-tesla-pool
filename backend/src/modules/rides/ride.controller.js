import * as rideService from "./ride.service.js";

export const createRide = async (req, res, next) => {
  try {
    const ride = await rideService.createRide({
      passengerId: req.user.id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      ride,
    });
  } catch (error) {
    next(error);
  }
};

export const getRideById = async (req, res, next) => {
  try {
    const ride = await rideService.getRideById({
      rideId: req.params.id,
      passengerId: req.user.id,
    });

    res.status(200).json({
      success: true,
      ride,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePoolingPreference = async (req, res, next) => {
  try {
    const ride = await rideService.updatePoolingPreference({
      rideId: req.params.id,
      passengerId: req.user.id,
      poolingPreference: req.body.poolingPreference,
    });

    res.status(200).json({
      success: true,
      message: "Pooling preference updated successfully",
      ride,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRide = async (req, res, next) => {
  try {
    const ride = await rideService.cancelRide({
      rideId: req.params.id,
      passengerId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
      ride,
    });
  } catch (error) {
    next(error);
  }
};