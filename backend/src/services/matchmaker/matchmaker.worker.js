import { runMatchmakingCycle } from "./matchmaker.service.js";

const MATCHMAKER_INTERVAL_MS = 2000;

let isRunning = false;

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const startMatchmaker = async () => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  console.log("Matchmaker worker started.");

  while (isRunning) {
    try {
      const result = await runMatchmakingCycle();

      if (
        result.requestedRides.length > 0 ||
        result.confirmedPools.length > 0
      ) {
        console.log("Matchmaker cycle:", result);
      }
    } catch (error) {
      console.error("Matchmaker cycle failed:", error);
    }

    await sleep(MATCHMAKER_INTERVAL_MS);
  }
};

export const stopMatchmaker = () => {
  isRunning = false;
};
