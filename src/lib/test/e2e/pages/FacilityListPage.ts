/**
 * FacilityListPage - Page Object Model for the Facility List page
 *
 * Encapsulates all interactions with the facility list page.
 * Provides methods for selecting facilities and navigating to their schedule pages.
 */

import { type Page, type Locator } from "@playwright/test";

export class FacilityListPage {
  readonly page: Page;
  readonly facilityGrid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.facilityGrid = page.getByTestId("facility-grid");
  }

  /**
   * Navigate to the facility list page (home page)
   */
  async goto() {
    await this.page.goto("/");
  }

  /**
   * Get a facility card by index (0-based)
   */
  getFacilityCard(index: number): Locator {
    return this.page.getByTestId(`facility-card-${index}`);
  }

  /**
   * Click on a facility card by index
   */
  async selectFacility(index: number) {
    await this.getFacilityCard(index).click();
  }

  /**
   * Wait for the facility list to load
   */
  async waitForLoad() {
    await this.facilityGrid.waitFor({ state: "visible" });
  }

  /**
   * Get the count of visible facility cards
   */
  async getFacilityCount(): Promise<number> {
    return await this.facilityGrid.locator('[data-testid^="facility-card-"]').count();
  }

  /**
   * Check if a specific facility card is visible
   */
  async isFacilityVisible(index: number): Promise<boolean> {
    return await this.getFacilityCard(index).isVisible();
  }
}
