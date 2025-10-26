/**
 * BookingDialog - Page Object Model component for the Booking Dialog
 *
 * Encapsulates all interactions with the booking dialog, including
 * duration selection and confirmation/cancellation actions.
 */

import { type Page, type Locator } from "@playwright/test";

export class BookingDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly durationSelectTrigger: Locator;
  readonly durationSelectContent: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("booking-dialog");
    this.durationSelectTrigger = page.getByTestId("duration-select-trigger");
    this.durationSelectContent = page.getByTestId("duration-select-content");
    this.confirmButton = page.getByTestId("booking-confirm-button");
    this.cancelButton = page.getByTestId("booking-cancel-button");
    this.errorMessage = page.getByTestId("booking-error-message");
  }

  /**
   * Wait for the dialog to open
   */
  async waitForOpen() {
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * Wait for the dialog to close
   */
  async waitForClose() {
    await this.dialog.waitFor({ state: "hidden" });
  }

  /**
   * Check if the dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  /**
   * Get a duration option by index
   */
  getDurationOption(index: number): Locator {
    return this.page.getByTestId(`duration-option-${index}`);
  }

  /**
   * Open the duration dropdown
   */
  async openDurationDropdown() {
    await this.durationSelectTrigger.click();
  }

  /**
   * Select a duration option by index
   */
  async selectDuration(index: number) {
    await this.openDurationDropdown();
    await this.getDurationOption(index).click();
  }

  /**
   * Click the confirm button
   */
  async confirm() {
    await this.confirmButton.click();
  }

  /**
   * Click the cancel button
   */
  async cancel() {
    await this.cancelButton.click();
  }

  /**
   * Complete the booking flow: select duration and confirm
   */
  async completeBooking(durationIndex: number) {
    await this.selectDuration(durationIndex);
    await this.confirm();
  }

  /**
   * Check if an error message is visible
   */
  async hasError(): Promise<boolean> {
    try {
      return await this.errorMessage.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if the confirm button is enabled
   */
  async isConfirmEnabled(): Promise<boolean> {
    return await this.confirmButton.isEnabled();
  }
}
