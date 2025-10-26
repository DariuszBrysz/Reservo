/**
 * Global Teardown for E2E Tests
 *
 * This file runs after all E2E tests have completed. It cleans up
 * any reservations created during the test run.
 */

import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";

teardown("cleanup test reservations", async () => {
  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME;
  const testUserPassword = process.env.E2E_PASSWORD;
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseServiceKey || !testUserEmail || !testUserPassword || !testUserId) {
    return;
  }

  // Create Supabase client with service role key for admin access
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  await supabase.auth.signInWithPassword({
    email: testUserEmail,
    password: testUserPassword,
  });
  await supabase.from("reservations").delete().eq("user_id", testUserId);
});
