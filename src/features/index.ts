import featureFlags, { type Feature, type Environment } from "./config";
import { PUBLIC_ENV_NAME } from "astro:env/server";

export const isFeatureEnabled = (feature: Feature): boolean => {
  const environment = PUBLIC_ENV_NAME;

  if (!environment) {
    return false;
  }

  const flagsForEnv = featureFlags[environment as Environment];

  if (!flagsForEnv) {
    return false;
  }

  return flagsForEnv[feature] ?? false;
};
