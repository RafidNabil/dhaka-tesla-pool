import * as vehicleService from "./vehicle.service.js";

export const updateVehicleStatus = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.updateVehicleStatus({
      driverId: req.user.id,
      online: req.body.online,
    });

    res.status(200).json({
      success: true,
      message: vehicle.online
        ? "Driver is now online"
        : "Driver is now offline",
      vehicle,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.getMyVehicle(
      req.user.id
    );

    res.status(200).json({
      success: true,
      vehicle,
    });
  } catch (error) {
    next(error);
  }
};