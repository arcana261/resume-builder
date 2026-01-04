import { promises as fs } from 'fs';
import path from 'path';
import type { BrowserContext, Page } from 'playwright';
import { logger } from '../../utils/logger.js';
import type { SessionData } from '../../types/index.js';

export class SessionManager {
  private sessionPath: string;
  private sessionTimeout: number;

  constructor(
    sessionPath = './data/linkedin-session.json',
    sessionTimeout = 86400000 // 24 hours
  ) {
    this.sessionPath = sessionPath;
    this.sessionTimeout = sessionTimeout;
  }

  /**
   * Save browser session to disk
   */
  async saveSession(context: BrowserContext, page: Page): Promise<void> {
    try {
      // Get all cookies
      const cookies = await context.cookies();

      // Get localStorage
      const localStorage = await page.evaluate(() => {
        const storage: Record<string, string> = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            storage[key] = window.localStorage.getItem(key) || '';
          }
        }
        return storage;
      });

      // Get sessionStorage
      const sessionStorage = await page.evaluate(() => {
        const storage: Record<string, string> = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          if (key) {
            storage[key] = window.sessionStorage.getItem(key) || '';
          }
        }
        return storage;
      });

      // Get current viewport and user agent
      const viewport = page.viewportSize();
      const userAgent = await page.evaluate(() => navigator.userAgent);

      // Build session data
      const sessionData: SessionData = {
        cookies,
        localStorage,
        sessionStorage,
        timestamp: Date.now(),
        userAgent,
        viewport: viewport || { width: 1920, height: 1080 }
      };

      // Ensure data directory exists
      await fs.mkdir(path.dirname(this.sessionPath), { recursive: true });

      // Write to file
      await fs.writeFile(
        this.sessionPath,
        JSON.stringify(sessionData, null, 2),
        'utf-8'
      );

      logger.info(`Session saved to ${this.sessionPath}`);
    } catch (error) {
      logger.error('Failed to save session:', error);
      throw error;
    }
  }

  /**
   * Load session from disk and restore to browser context
   */
  async loadSession(context: BrowserContext, page: Page): Promise<boolean> {
    try {
      if (!this.sessionExists()) {
        logger.debug('No session file found');
        return false;
      }

      // Read session file
      const sessionJson = await fs.readFile(this.sessionPath, 'utf-8');
      const sessionData: SessionData = JSON.parse(sessionJson);

      // Check if expired
      const age = Date.now() - sessionData.timestamp;
      if (age > this.sessionTimeout) {
        logger.warn(`Session expired (age: ${Math.floor(age / 1000 / 60)} minutes)`);
        return false;
      }

      // Restore cookies
      await context.addCookies(sessionData.cookies);
      logger.debug(`Restored ${sessionData.cookies.length} cookies`);

      // Restore localStorage
      await page.evaluate((data) => {
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value);
        }
      }, sessionData.localStorage);
      logger.debug(`Restored ${Object.keys(sessionData.localStorage).length} localStorage items`);

      // Restore sessionStorage
      await page.evaluate((data) => {
        for (const [key, value] of Object.entries(data)) {
          sessionStorage.setItem(key, value);
        }
      }, sessionData.sessionStorage);
      logger.debug(`Restored ${Object.keys(sessionData.sessionStorage).length} sessionStorage items`);

      logger.info('Session restored successfully');
      return true;
    } catch (error) {
      logger.error('Failed to load session:', error);
      return false;
    }
  }

  /**
   * Check if session file exists
   */
  sessionExists(): boolean {
    try {
      const fs = require('fs');
      return fs.existsSync(this.sessionPath);
    } catch {
      return false;
    }
  }

  /**
   * Clear session file
   */
  async clearSession(): Promise<void> {
    try {
      if (this.sessionExists()) {
        await fs.unlink(this.sessionPath);
        logger.info('Session cleared');
      }
    } catch (error) {
      logger.error('Failed to clear session:', error);
      throw error;
    }
  }

  /**
   * Get session age in milliseconds
   */
  getSessionAge(): number | null {
    try {
      if (!this.sessionExists()) {
        return null;
      }

      const fs = require('fs');
      const sessionJson = fs.readFileSync(this.sessionPath, 'utf-8');
      const sessionData: SessionData = JSON.parse(sessionJson);

      return Date.now() - sessionData.timestamp;
    } catch {
      return null;
    }
  }

  /**
   * Get session file path
   */
  getSessionPath(): string {
    return path.resolve(this.sessionPath);
  }
}
