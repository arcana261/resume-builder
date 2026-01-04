import type { Page } from 'playwright';
import { logger } from '../../utils/logger.js';

export class LoginDetector {
  /**
   * Check if user is logged in to LinkedIn
   */
  async isLoggedIn(page: Page): Promise<boolean> {
    try {
      // Strategy 1: Check for auth cookies
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(c =>
        c.name === 'li_at' && c.value.length > 0
      );

      if (!hasAuthCookie) {
        logger.debug('No li_at cookie found');
        return false;
      }

      // Strategy 2: Check DOM for logged-in indicators
      // Navigate to feed to verify
      await page.goto('https://www.linkedin.com/feed/', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      const isLoggedIn = await page.evaluate(() => {
        // Check for profile navigation (logged in)
        const profileNav = document.querySelector('.global-nav__me');

        // Check for sign-in form (not logged in)
        const signInForm = document.querySelector('.sign-in-form');

        return !!profileNav && !signInForm;
      });

      return isLoggedIn;
    } catch (error) {
      logger.warn('Failed to detect login status:', error);
      return false;
    }
  }

  /**
   * Navigate to LinkedIn login page
   */
  async navigateToLogin(page: Page): Promise<void> {
    await page.goto('https://www.linkedin.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    logger.info('Navigated to LinkedIn login page');
  }

  /**
   * Wait for user to complete login
   */
  async waitForLogin(page: Page, timeout = 300000): Promise<void> {
    logger.info('Waiting for user to complete login...');

    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeout) {
      if (await this.isLoggedIn(page)) {
        logger.info('Login successful!');
        return;
      }

      // Show progress every 30 seconds
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed % 30 === 0 && elapsed > 0) {
        logger.info(`Still waiting... (${elapsed}s elapsed)`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Login timeout - user did not complete login within time limit');
  }
}
