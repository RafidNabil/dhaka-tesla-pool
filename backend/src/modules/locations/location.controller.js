import * as locationService from "./location.service.js";

export const getAllLocations = async (req, res, next) => {
  try {
    const locations = await locationService.getAllLocations();

    res.status(200).json({
      success: true,
      locations,
    });
  } catch (error) {
    next(error);
  }
};

export const getLocationById = async (req, res, next) => {
  try {
    const location = await locationService.getLocationById(req.params.id);

    res.status(200).json({
      success: true,
      location,
    });
  } catch (error) {
    next(error);
  }
};