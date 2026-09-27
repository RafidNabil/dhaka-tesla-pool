import { prisma } from "../src/config/prisma.js";

const locations = [
  {
    name: "Dhanmondi",
    latitude: 23.746466,
    longitude: 90.376015,
  },
  {
    name: "Gulshan",
    latitude: 23.797911,
    longitude: 90.414391,
  },
  {
    name: "Banani",
    latitude: 23.793,
    longitude: 90.405,
  },
  {
    name: "Uttara",
    latitude: 23.873751,
    longitude: 90.396454,
  },
  {
    name: "Mirpur",
    latitude: 23.82235,
    longitude: 90.365417,
  },
  {
    name: "Mohammadpur",
    latitude: 23.77,
    longitude: 90.363,
  },
  {
    name: "Farmgate",
    latitude: 23.75815,
    longitude: 90.38965,
  },
  {
    name: "Motijheel",
    latitude: 23.72772,
    longitude: 90.41919,
  },
  {
    name: "Bashundhara",
    latitude: 23.8151,
    longitude: 90.4256,
  },
  {
    name: "Tejgaon",
    latitude: 23.762956,
    longitude: 90.389713,
  },
];

const seed = async () => {
  for (const location of locations) {
    await prisma.location.upsert({
      where: {
        name: location.name,
      },
      update: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      create: location,
    });
  }

  console.log(`Seeded ${locations.length} locations.`);
};

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });