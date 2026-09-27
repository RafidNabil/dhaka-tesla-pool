const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
};

export const calculateDistanceKm = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const lat1 = toRadians(Number(latitude1));
  const lat2 = toRadians(Number(latitude2));

  const deltaLat = toRadians(Number(latitude2) - Number(latitude1));
  const deltaLon = toRadians(Number(longitude2) - Number(longitude1));

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};