import * as offerService from "./offer.service.js";

export const getOfferById = async (req, res, next) => {
  try {
    const offer = await offerService.getOfferById({
      offerId: req.params.id,
      driverId: req.user.id,
    });

    res.status(200).json({
      success: true,
      offer,
    });
  } catch (error) {
    next(error);
  }
};

export const getDriverOffers = async (req, res, next) => {
  try {
    const offers = await offerService.getDriverOffers(
      req.user.id
    );

    res.status(200).json({
      success: true,
      offers,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptOffer = async (req, res, next) => {
  try {
    const offer = await offerService.acceptOffer({
      offerId: req.params.id,
      driverId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Pool offer accepted successfully",
      offer,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectOffer = async (req, res, next) => {
  try {
    const offer = await offerService.rejectOffer({
      offerId: req.params.id,
      driverId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Pool offer rejected successfully",
      offer,
    });
  } catch (error) {
    next(error);
  }
};