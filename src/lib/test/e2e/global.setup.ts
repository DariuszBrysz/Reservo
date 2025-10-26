/**
 * Global Setup for E2E Tests
 *
 * This file runs before all E2E tests. It initializes the test environment
 * and tracks reservation IDs created during tests for cleanup in teardown.
 */

import { test as setup } from "@playwright/test";

setup("initialize test environment", async () => {
  // Test environment initialization
});
