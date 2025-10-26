/**
 * E2E Test: Complete Reservation Flow
 *
 * This test covers the complete user journey from login to making a reservation:
 * 1. Login to the application
 * 2. Wait for the facility list page to load
 * 3. Select the first available facility
 * 4. Wait for the facility schedule page to load
 * 5. Select the second date option from DateSelector
 * 6. Wait for schedule data to load
 * 7. Select the first available time slot from ScheduleView
 * 8. Wait for the booking dialog to open
 * 9. Select the first duration option from the dropdown
 * 10. Confirm the reservation
 * 11. Verify that the time slot becomes unavailable after booking
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { FacilityListPage } from "./pages/FacilityListPage";
import { FacilitySchedulePage } from "./pages/FacilitySchedulePage";

test.describe("Complete Reservation Flow", () => {
  let loginPage: LoginPage;
  let facilityListPage: FacilityListPage;
  let facilitySchedulePage: FacilitySchedulePage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    loginPage = new LoginPage(page);
    facilityListPage = new FacilityListPage(page);
    facilitySchedulePage = new FacilitySchedulePage(page);
  });

  test("user can login, select a facility, choose a date, and make a reservation", async ({ page }) => {
    // Step 1: Login to the application
    await loginPage.goto();
    const email = process.env.E2E_USERNAME || "";
    const password = process.env.E2E_PASSWORD || "";

    expect(email, "E2E_USERNAME environment variable must be set").toBeTruthy();
    expect(password, "E2E_PASSWORD environment variable must be set").toBeTruthy();

    await loginPage.login(email, password);

    // Step 2: Wait for page to load (should redirect to home page after login)
    await loginPage.waitForNavigation();
    await facilityListPage.waitForLoad();

    // Verify we're on the facility list page
    await expect(facilityListPage.facilityGrid).toBeVisible();

    // Step 3: Select first available facility
    const firstFacility = facilityListPage.getFacilityCard(0);
    await expect(firstFacility).toBeVisible();
    await facilityListPage.selectFacility(0);

    // Step 4: Wait for page to load (facility schedule page)
    await facilitySchedulePage.waitForLoad();

    // Verify we're on the facility schedule page
    await expect(facilitySchedulePage.dateSelector).toBeVisible();
    await expect(facilitySchedulePage.scheduleView).toBeVisible();

    // Step 5: Select second option from DateSelector (index 1 = tomorrow)
    const secondDateButton = facilitySchedulePage.getDateButton(1);
    await expect(secondDateButton).toBeVisible();
    await facilitySchedulePage.selectDate(1);

    // Step 6: Wait for data to load
    await facilitySchedulePage.waitForScheduleLoad();

    // Verify that we have time slots available
    const availableSlotCount = await facilitySchedulePage.getAvailableTimeSlotCount();
    expect(availableSlotCount, "There should be at least one available time slot").toBeGreaterThan(0);

    // Step 7: Select first element from the ScheduleView list (first available time slot)
    const firstTimeSlot = facilitySchedulePage.getAvailableTimeSlot(0);
    await expect(firstTimeSlot).toBeVisible();
    await facilitySchedulePage.selectTimeSlot(0);

    // Step 8: Wait for dialog to open
    await facilitySchedulePage.bookingDialog.waitForOpen();
    await expect(facilitySchedulePage.bookingDialog.dialog).toBeVisible();

    // Step 9: Select first option from the Duration dropdown
    await facilitySchedulePage.bookingDialog.selectDuration(0);

    // Verify that the confirm button is enabled after selecting duration
    const isConfirmEnabled = await facilitySchedulePage.bookingDialog.isConfirmEnabled();
    expect(isConfirmEnabled, "Confirm button should be enabled after selecting duration").toBe(true);

    // Step 10: Confirm reservation
    await facilitySchedulePage.bookingDialog.confirm();

    // Wait for the dialog to close and data to reload
    await facilitySchedulePage.bookingDialog.waitForClose();
    await page.waitForTimeout(1000); // Wait for the data to reload after booking

    // Step 11: Verify that the time slot is now unavailable (booked)
    // The first slot should now be booked instead of available
    const isFirstSlotBooked = await facilitySchedulePage.isTimeSlotBooked(0);
    expect(isFirstSlotBooked, "The first time slot should be booked after reservation").toBe(true);

    // Alternatively, verify that the first available slot is no longer the same one
    // by checking if it still exists as available
    const isFirstSlotStillAvailable = await facilitySchedulePage.isTimeSlotAvailable(0);

    // If the slot is now booked, it shouldn't be available anymore at the same position
    // Note: This depends on how the schedule renders - if booked slots are shown in the same list
    if (!isFirstSlotBooked) {
      // If the UI removes booked slots from available list entirely
      expect(isFirstSlotStillAvailable, "The time slot should be unavailable after successful booking").toBe(false);
    }
  });

  test("user cannot confirm reservation without selecting duration", async () => {
    // Login
    await loginPage.goto();
    const email = process.env.E2E_USERNAME || "";
    const password = process.env.E2E_PASSWORD || "";
    await loginPage.login(email, password);
    await loginPage.waitForNavigation();

    // Navigate to facility schedule
    await facilityListPage.waitForLoad();
    await facilityListPage.selectFacility(0);
    await facilitySchedulePage.waitForLoad();

    // Select a time slot
    await facilitySchedulePage.selectTimeSlot(0);
    await facilitySchedulePage.bookingDialog.waitForOpen();

    // Try to confirm without selecting duration
    const isConfirmEnabled = await facilitySchedulePage.bookingDialog.isConfirmEnabled();
    expect(isConfirmEnabled, "Confirm button should be disabled without duration selection").toBe(false);
  });
});
