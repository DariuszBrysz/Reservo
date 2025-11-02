export type Feature = "auth" | "facilities" | "reservations";

export type Environment = "local" | "integration" | "production";

const featureFlags: Record<Environment, Record<Feature, boolean>> = {
  local: {
    auth: true,
    facilities: true,
    reservations: true,
  },
  integration: {
    auth: true,
    facilities: true,
    reservations: true,
  },
  production: {
    auth: true,
    facilities: true,
    reservations: true,
  },
};

export default featureFlags;
