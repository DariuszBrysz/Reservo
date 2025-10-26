/**
 * LoginPage - Page Object Model for the Login page
 *
 * Encapsulates all interactions with the login page, following the POM pattern.
 * Provides methods for filling in credentials and submitting the form.
 */

import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loginForm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.getByTestId("login-error-message");
    this.loginForm = page.getByTestId("login-form");
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto("/login");
  }

  /**
   * Fill in the email field
   */
  async fillEmail(email: string) {
    await this.emailInput.pressSequentially(email, { delay: 500 });
  }

  /**
   * Fill in the password field
   */
  async fillPassword(password: string) {
    await this.passwordInput.pressSequentially(password, { delay: 500 });
  }

  /**
   * Submit the login form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Complete login flow with email and password
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * Wait for successful navigation after login
   */
  async waitForNavigation() {
    await this.page.waitForURL("/");
  }

  /**
   * Check if an error message is visible
   */
  async hasError() {
    return await this.errorMessage.isVisible();
  }
}
