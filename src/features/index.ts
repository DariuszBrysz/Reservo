import featureFlags, { type Feature, type Environment } from "./config";

export const isFeatureEnabled = (feature: Feature): boolean => {
  const environment = import.meta.env.PUBLIC_ENV_NAME;

  if (!environment) {
    return false;
  }

  const flagsForEnv = featureFlags[environment as Environment];

  if (!flagsForEnv) {
    return false;
  }

  return flagsForEnv[feature] ?? false;
};
