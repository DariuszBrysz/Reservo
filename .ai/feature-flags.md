### Feature Flag Module Design

As you requested, here is a design for a universal TypeScript module in `src/features`. It will consist of two files: one for configuration and one for the logic to check the flags.

First, create a new directory: `src/features`.

#### 1. Feature Flag Configuration

This file defines the feature flags for each environment.

**File:** `src/features/config.ts`
```typescript
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
  prod: {
    auth: true,
    facilities: true,
    reservations: true,
  },
};

export default featureFlags;
```

#### 2. Feature Flag Checker

This file contains the logic to read the current environment and determine if a feature is enabled. It defaults to `false` (disabled) if a flag isn't explicitly defined.

**File:** `src/features/index.ts`
```typescript
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
```

### How to Use It

You can now import `isFeatureEnabled` in your Astro pages, API endpoints, or React components to conditionally render content or enable/disable functionality.

**Example usage in an Astro page or API endpoint:**
```typescript
---
// src/pages/my-reservations.astro
import { isFeatureEnabled } from '../features';

if (!isFeatureEnabled('reservations')) {
  return Astro.redirect('/404');
}
---
<!-- Page content for my-reservations -->
```
