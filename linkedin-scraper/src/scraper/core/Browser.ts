import { chromium, firefox, webkit, Browser as PlaywrightBrowser, Page, BrowserContext } from 'playwright';
import { logger } from '../../utils/logger.js';

export interface BrowserOptions {
  headless?: boolean;
  type?: 'chromium' | 'firefox' | 'webkit';
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  stealth?: boolean;
}

export class Browser {
  private browser: PlaywrightBrowser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private options: BrowserOptions;

  constructor(options: BrowserOptions = {}) {
    this.options = {
      headless: options.headless !== false,
      type: options.type || 'chromium',
      stealth: options.stealth !== false,
      ...options
    };
  }

  async launch(): Promise<void> {
    try {
      logger.info('Launching browser', { type: this.options.type });

      const browserType = this.getBrowserType();

      const launchOptions: any = {
        headless: this.options.headless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
        ]
      };

      if (this.options.proxy) {
        launchOptions.proxy = {
          server: this.options.proxy.server,
          username: this.options.proxy.username,
          password: this.options.proxy.password
        };
      }

      this.browser = await browserType.launch(launchOptions);

      // Create context with realistic viewport and user agent
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: this.getRandomUserAgent(),
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: []
      });

      // Add stealth modifications
      if (this.options.stealth) {
        await this.applyStealth(this.context);
      }

      this.page = await this.context.newPage();

      logger.info('Browser launched successfully');
    } catch (error) {
      logger.error('Failed to launch browser', { error });
      throw error;
    }
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call launch() first.');
    }

    try {
      logger.info('Navigating to URL', { url });
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await this.randomDelay(1000, 3000);

      // Remove modal overlay if present
      await this.removeModalOverlayWithWait();
    } catch (error) {
      logger.error('Navigation failed', { url, error });
      throw error;
    }
  }

  async waitForSelector(selector: string, timeout = 10000): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.waitForSelector(selector, { timeout });
  }

  async click(selector: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.click(selector);
    await this.randomDelay(500, 1500);
  }

  async getText(selector: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const element = await this.page.$(selector);
    if (!element) {
      return null;
    }

    return await element.textContent();
  }

  async getHTML(selector: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const element = await this.page.$(selector);
    if (!element) {
      return null;
    }

    return await element.innerHTML();
  }

  async scrollDown(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    await this.page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await this.randomDelay(500, 1500);
  }

  /**
   * Remove modal overlay from the page immediately if present
   * Does not wait - checks and removes synchronously
   */
  async removeModalOverlay(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      const removed = await this.page.evaluate(() => {
        const modalOverlay = document.querySelector('.modal__overlay');
        if (modalOverlay) {
          modalOverlay.remove();
          return true;
        }
        return false;
      });

      if (removed) {
        logger.debug('Modal overlay removed from DOM');
      }
    } catch (error: any) {
      logger.debug('Error checking for modal overlay', { error: error.message });
    }
  }

  /**
   * Remove modal overlay from the page if present (with timeout)
   * Waits up to 5 seconds for .modal__overlay to appear, then removes it from DOM
   * Continues without error if not found
   */
  private async removeModalOverlayWithWait(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      logger.debug('Checking for modal overlay');

      // Wait for modal overlay with 5 second timeout
      await this.page.waitForSelector('.modal__overlay', {
        timeout: 5000,
        state: 'attached'
      });

      // Modal found - remove it from DOM
      logger.info('Modal overlay detected, removing from DOM');
      await this.page.evaluate(() => {
        const modalOverlay = document.querySelector('.modal__overlay');
        if (modalOverlay) {
          modalOverlay.remove();
          return true;
        }
        return false;
      });

      logger.info('Modal overlay removed successfully');
      await this.randomDelay(300, 500);
    } catch (error: any) {
      // TimeoutError is expected when modal doesn't exist - this is not an error
      if (error.name === 'TimeoutError' || error.message?.includes('Timeout')) {
        logger.debug('No modal overlay found (this is normal)');
      } else {
        // Log unexpected errors but don't throw - we want to continue
        logger.warn('Unexpected error while checking for modal overlay', { error: error.message });
      }
    }
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      logger.info('Browser closed');
    } catch (error) {
      logger.error('Error closing browser', { error });
    }
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }
    return this.page;
  }

  private getBrowserType() {
    switch (this.options.type) {
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      case 'chromium':
      default:
        return chromium;
    }
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  private async applyStealth(context: BrowserContext): Promise<void> {
    // Override navigator.webdriver
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });

      // Override Chrome detection
      (window as any).chrome = {
        runtime: {}
      };

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters);
    });
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
