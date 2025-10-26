/**
 * FacilitySchedulePage - Page Object Model for the Facility Schedule page
 *
 * Encapsulates all interactions with the facility schedule page including
 * date selection, time slot selection, and booking dialog interactions.
 */

import { type Page, type Locator } from "@playwright/test";
import { BookingDialog } from "./components/BookingDialog";

export class FacilitySchedulePage {
  readonly page: Page;
  readonly dateSelector: Locator;
  readonly scheduleView: Locator;
  readonly bookingDialog: BookingDialog;

  constructor(page: Page) {
    this.page = page;
    this.dateSelector = page.getByTestId("date-selector");
    this.scheduleView = page.getByTestId("schedule-view");
    this.bookingDialog = new BookingDialog(page);
  }

  /**
   * Navigate to a specific facility's schedule page
   */
  async goto(facilityId: number) {
    await this.page.goto(`/facilities/${facilityId}`);
  }

  /**
   * Get a date button by index (0-based, where 0 is today)
   */
  getDateButton(index: number): Locator {
    return this.page.getByTestId(`date-button-${index}`);
  }

  /**
   * Select a date by index (0 = today, 1 = tomorrow, etc.)
   */
  async selectDate(index: number) {
    await this.getDateButton(index).click();
  }

  /**
   * Get an available time slot by index
   */
  getAvailableTimeSlot(index: number): Locator {
    return this.page.getByTestId(`time-slot-available-${index}`);
  }

  /**
   * Get a booked time slot by index
   */
  getBookedTimeSlot(index: number): Locator {
    return this.page.getByTestId(`time-slot-booked-${index}`);
  }

  /**
   * Select an available time slot by index
   */
  async selectTimeSlot(index: number) {
    await this.getAvailableTimeSlot(index).click();
  }

  /**
   * Wait for the schedule to load
   */
  async waitForScheduleLoad() {
    await this.scheduleView.waitFor({ state: "visible" });
    // Wait for potential skeleton loaders to disappear
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if a time slot is available
   */
  async isTimeSlotAvailable(index: number): Promise<boolean> {
    try {
      return await this.getAvailableTimeSlot(index).isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if a time slot is booked
   */
  async isTimeSlotBooked(index: number): Promise<boolean> {
    try {
      return await this.getBookedTimeSlot(index).isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get the count of available time slots
   */
  async getAvailableTimeSlotCount(): Promise<number> {
    return await this.page.locator('[data-testid^="time-slot-available-"]').count();
  }

  /**
   * Wait for the page to fully load (including initial data)
   */
  async waitForLoad() {
    await this.dateSelector.waitFor({ state: "visible" });
    await this.waitForScheduleLoad();
  }
}
