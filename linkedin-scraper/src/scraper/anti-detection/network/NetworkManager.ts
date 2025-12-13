/**
 * Network Manager
 *
 * Manages network-related anti-detection measures:
 * - Proxy rotation and management
 * - Request header randomization
 * - Cookie management
 * - Session persistence
 */

import type { BrowserContext, Page } from 'playwright';
import type { NetworkConfig, ProxyConfig } from '../types.js';
import { logger } from '../../../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  enableProxyRotation: false,
  proxyPool: [],
  randomizeHeaders: true,
  manageCookies: true,
  persistSessions: false
};

// ============================================================================
// Common Request Headers
// ============================================================================

const ACCEPT_HEADERS = [
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
];

const ACCEPT_ENCODING = [
  'gzip, deflate, br',
  'gzip, deflate, br, zstd',
  'gzip, deflate',
  'gzip, deflate, br, compress'
];

const DNT_VALUES = ['1', null]; // Do Not Track header

const UPGRADE_INSECURE_REQUESTS = ['1', null];

const CACHE_CONTROL = [
  'max-age=0',
  'no-cache',
  null
];

// ============================================================================
// Session Storage
// ============================================================================

interface SessionData {
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  timestamp: number;
  fingerprint: string;
}

// ============================================================================
// NetworkManager Implementation
// ============================================================================

export class NetworkManager {
  private config: NetworkConfig;
  private currentProxyIndex: number = 0;
  private proxyFailures: Map<string, number> = new Map();
  private sessionDir: string;
  private currentSession: SessionData | null = null;

  constructor(config?: Partial<NetworkConfig>) {
    this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };
    this.sessionDir = path.join(process.cwd(), '.sessions');

    if (this.config.persistSessions) {
      this.ensureSessionDir();
    }

    logger.debug('[Network] NetworkManager initialized', {
      proxyRotation: this.config.enableProxyRotation,
      proxyCount: this.config.proxyPool?.length || 0,
      headerRandomization: this.config.randomizeHeaders,
      cookieManagement: this.config.manageCookies,
      sessionPersistence: this.config.persistSessions
    });
  }

  // ============================================================================
  // Proxy Management
  // ============================================================================

  /**
   * Get the next proxy from the pool
   */
  getNextProxy(): ProxyConfig | null {
    if (!this.config.enableProxyRotation || !this.config.proxyPool || this.config.proxyPool.length === 0) {
      return null;
    }

    // Find next working proxy (skip failed ones)
    let attempts = 0;
    const maxAttempts = this.config.proxyPool.length;

    while (attempts < maxAttempts) {
      const proxy = this.config.proxyPool[this.currentProxyIndex];
      const proxyKey = this.getProxyKey(proxy);
      const failures = this.proxyFailures.get(proxyKey) || 0;

      // Skip proxies that have failed more than 3 times
      if (failures < 3) {
        logger.debug('[Network] Selected proxy', {
          index: this.currentProxyIndex,
          server: proxy.server,
          failures
        });

        // Move to next proxy for next time
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.config.proxyPool.length;
        return proxy;
      }

      // Try next proxy
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.config.proxyPool.length;
      attempts++;
    }

    logger.warn('[Network] All proxies have failed, using direct connection');
    return null;
  }

  /**
   * Report a proxy failure
   */
  reportProxyFailure(proxy: ProxyConfig): void {
    const proxyKey = this.getProxyKey(proxy);
    const currentFailures = this.proxyFailures.get(proxyKey) || 0;
    this.proxyFailures.set(proxyKey, currentFailures + 1);

    logger.warn('[Network] Proxy failure reported', {
      server: proxy.server,
      totalFailures: currentFailures + 1
    });
  }

  /**
   * Reset proxy failures
   */
  resetProxyFailures(): void {
    this.proxyFailures.clear();
    logger.info('[Network] Proxy failures reset');
  }

  /**
   * Get unique key for proxy
   */
  private getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.server}:${proxy.username || 'none'}`;
  }

  // ============================================================================
  // Header Randomization
  // ============================================================================

  /**
   * Generate randomized request headers
   */
  generateRandomHeaders(): Record<string, string> {
    if (!this.config.randomizeHeaders) {
      return {};
    }

    const headers: Record<string, string> = {
      'Accept': this.selectRandom(ACCEPT_HEADERS),
      'Accept-Encoding': this.selectRandom(ACCEPT_ENCODING),
      'Accept-Language': this.generateAcceptLanguage(),
      'Cache-Control': this.selectRandom(CACHE_CONTROL) || 'max-age=0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    };

    // Randomly add DNT header
    const dnt = this.selectRandom(DNT_VALUES);
    if (dnt) {
      headers['DNT'] = dnt;
    }

    // Randomly add Upgrade-Insecure-Requests
    const upgrade = this.selectRandom(UPGRADE_INSECURE_REQUESTS);
    if (upgrade) {
      headers['Upgrade-Insecure-Requests'] = upgrade;
    }

    logger.debug('[Network] Generated random headers', {
      headerCount: Object.keys(headers).length
    });

    return headers;
  }

  /**
   * Generate Accept-Language header with realistic priority values
   */
  private generateAcceptLanguage(): string {
    const languages = [
      'en-US,en;q=0.9',
      'en-GB,en;q=0.9',
      'en-US,en;q=0.9,es;q=0.8',
      'en-US,en;q=0.9,fr;q=0.8',
      'en-GB,en;q=0.9,en-US;q=0.8',
      'en-US,en;q=0.9,de;q=0.8,fr;q=0.7',
      'en-US,en;q=0.9,ja;q=0.8',
      'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7'
    ];

    return this.selectRandom(languages);
  }

  /**
   * Apply headers to browser context
   */
  async applyHeaders(context: BrowserContext): Promise<void> {
    if (!this.config.randomizeHeaders) {
      return;
    }

    const headers = this.generateRandomHeaders();

    // Set extra HTTP headers
    await context.setExtraHTTPHeaders(headers);

    logger.debug('[Network] Headers applied to context');
  }

  // ============================================================================
  // Cookie Management
  // ============================================================================

  /**
   * Save cookies from context
   */
  async saveCookies(context: BrowserContext, fingerprint: string): Promise<void> {
    if (!this.config.manageCookies) {
      return;
    }

    try {
      const cookies = await context.cookies();

      if (this.currentSession) {
        this.currentSession.cookies = cookies;
        this.currentSession.timestamp = Date.now();
      } else {
        this.currentSession = {
          cookies,
          localStorage: {},
          sessionStorage: {},
          timestamp: Date.now(),
          fingerprint
        };
      }

      if (this.config.persistSessions) {
        await this.persistSession(fingerprint);
      }

      logger.debug('[Network] Cookies saved', {
        cookieCount: cookies.length,
        fingerprint
      });
    } catch (error) {
      logger.warn('[Network] Failed to save cookies', { error });
    }
  }

  /**
   * Load cookies into context
   */
  async loadCookies(context: BrowserContext, fingerprint: string): Promise<void> {
    if (!this.config.manageCookies) {
      return;
    }

    try {
      // Try to load persisted session first
      if (this.config.persistSessions) {
        await this.loadPersistedSession(fingerprint);
      }

      if (this.currentSession && this.currentSession.cookies.length > 0) {
        await context.addCookies(this.currentSession.cookies);

        logger.debug('[Network] Cookies loaded', {
          cookieCount: this.currentSession.cookies.length,
          fingerprint
        });
      }
    } catch (error) {
      logger.warn('[Network] Failed to load cookies', { error });
    }
  }

  /**
   * Clear cookies from current session
   */
  clearCookies(): void {
    if (this.currentSession) {
      this.currentSession.cookies = [];
    }
    logger.debug('[Network] Cookies cleared');
  }

  // ============================================================================
  // Session Persistence
  // ============================================================================

  /**
   * Save storage data from page
   */
  async saveStorageData(page: Page, fingerprint: string): Promise<void> {
    if (!this.config.persistSessions) {
      return;
    }

    try {
      const storageData = await page.evaluate(() => {
        const local: Record<string, string> = {};
        const session: Record<string, string> = {};

        // Get localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            local[key] = localStorage.getItem(key) || '';
          }
        }

        // Get sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            session[key] = sessionStorage.getItem(key) || '';
          }
        }

        return { local, session };
      });

      if (this.currentSession) {
        this.currentSession.localStorage = storageData.local;
        this.currentSession.sessionStorage = storageData.session;
        this.currentSession.timestamp = Date.now();
      }

      await this.persistSession(fingerprint);

      logger.debug('[Network] Storage data saved', {
        localStorageKeys: Object.keys(storageData.local).length,
        sessionStorageKeys: Object.keys(storageData.session).length,
        fingerprint
      });
    } catch (error) {
      logger.warn('[Network] Failed to save storage data', { error });
    }
  }

  /**
   * Load storage data into page
   */
  async loadStorageData(page: Page, fingerprint: string): Promise<void> {
    if (!this.config.persistSessions) {
      return;
    }

    try {
      await this.loadPersistedSession(fingerprint);

      if (this.currentSession) {
        await page.evaluate((data) => {
          // Set localStorage
          Object.entries(data.local).forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });

          // Set sessionStorage
          Object.entries(data.session).forEach(([key, value]) => {
            sessionStorage.setItem(key, value);
          });
        }, {
          local: this.currentSession.localStorage,
          session: this.currentSession.sessionStorage
        });

        logger.debug('[Network] Storage data loaded', {
          localStorageKeys: Object.keys(this.currentSession.localStorage).length,
          sessionStorageKeys: Object.keys(this.currentSession.sessionStorage).length,
          fingerprint
        });
      }
    } catch (error) {
      logger.warn('[Network] Failed to load storage data', { error });
    }
  }

  /**
   * Persist session to disk
   */
  private async persistSession(fingerprint: string): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    const sessionPath = path.join(this.sessionDir, `${fingerprint}.json`);

    try {
      await fs.promises.writeFile(
        sessionPath,
        JSON.stringify(this.currentSession, null, 2),
        'utf-8'
      );

      logger.debug('[Network] Session persisted to disk', { fingerprint });
    } catch (error) {
      logger.warn('[Network] Failed to persist session', { error });
    }
  }

  /**
   * Load persisted session from disk
   */
  private async loadPersistedSession(fingerprint: string): Promise<void> {
    const sessionPath = path.join(this.sessionDir, `${fingerprint}.json`);

    try {
      if (!fs.existsSync(sessionPath)) {
        logger.debug('[Network] No persisted session found', { fingerprint });
        return;
      }

      const sessionData = await fs.promises.readFile(sessionPath, 'utf-8');
      this.currentSession = JSON.parse(sessionData);

      // Check if session is not too old (7 days)
      const sessionAge = Date.now() - (this.currentSession?.timestamp || 0);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (sessionAge > maxAge) {
        logger.warn('[Network] Session too old, ignoring', {
          fingerprint,
          ageHours: sessionAge / (60 * 60 * 1000)
        });
        this.currentSession = null;
        return;
      }

      logger.debug('[Network] Session loaded from disk', {
        fingerprint,
        ageHours: sessionAge / (60 * 60 * 1000)
      });
    } catch (error) {
      logger.warn('[Network] Failed to load persisted session', { error });
    }
  }

  /**
   * Ensure session directory exists
   */
  private ensureSessionDir(): void {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
      logger.debug('[Network] Session directory created', { dir: this.sessionDir });
    }
  }

  /**
   * Delete old sessions
   */
  async cleanOldSessions(maxAgeDays: number = 7): Promise<void> {
    if (!this.config.persistSessions || !fs.existsSync(this.sessionDir)) {
      return;
    }

    try {
      const files = await fs.promises.readdir(this.sessionDir);
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.sessionDir, file);
        const stats = await fs.promises.stat(filePath);
        const age = Date.now() - stats.mtimeMs;

        if (age > maxAge) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      }

      logger.info('[Network] Old sessions cleaned', { deletedCount, maxAgeDays });
    } catch (error) {
      logger.warn('[Network] Failed to clean old sessions', { error });
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Get current configuration
   */
  getConfig(): NetworkConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('[Network] Configuration updated', { config: this.config });
  }

  /**
   * Get current session data
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
    logger.debug('[Network] Session cleared');
  }
}
