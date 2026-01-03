/**
 * Browser Fingerprint Generator
 *
 * Generates realistic browser fingerprints with randomization
 * to avoid detection through fingerprinting techniques.
 */

import type { BrowserFingerprint, Viewport, ScreenResolution } from '../types.js';

// ============================================================================
// Viewport Configurations (Common Real-World Resolutions)
// ============================================================================

const COMMON_VIEWPORTS: Viewport[] = [
  // Desktop - Most Common
  { width: 1920, height: 1080 },  // Full HD - 23%
  { width: 1366, height: 768 },   // Laptop - 19%
  { width: 1536, height: 864 },   // HD+ - 8%
  { width: 1440, height: 900 },   // MacBook - 7%
  { width: 1280, height: 720 },   // HD - 5%

  // Desktop - Less Common but Real
  { width: 2560, height: 1440 },  // QHD - 4%
  { width: 1600, height: 900 },   // HD+ - 3%
  { width: 1680, height: 1050 },  // WSXGA+ - 2%
  { width: 1920, height: 1200 },  // WUXGA - 2%
  { width: 3840, height: 2160 },  // 4K - 1%
];

// ============================================================================
// Screen Resolutions (Monitor Specs)
// ============================================================================

const SCREEN_RESOLUTIONS: ScreenResolution[] = [
  { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 },
  { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1.25 },
  { width: 2560, height: 1440, colorDepth: 24, pixelRatio: 1 },
  { width: 2560, height: 1440, colorDepth: 24, pixelRatio: 1.5 },
  { width: 1366, height: 768, colorDepth: 24, pixelRatio: 1 },
  { width: 1536, height: 864, colorDepth: 24, pixelRatio: 1.25 },
  { width: 3840, height: 2160, colorDepth: 24, pixelRatio: 2 },
  { width: 2880, height: 1800, colorDepth: 24, pixelRatio: 2 },  // MacBook Pro Retina
];

// ============================================================================
// User Agents (Real Browser User Agents - Regularly Updated)
// ============================================================================

const USER_AGENTS = {
  chrome_windows: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  ],

  chrome_mac: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ],

  chrome_linux: [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ],

  edge_windows: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ],

  firefox_windows: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  ],

  firefox_mac: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
  ],

  safari_mac: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ]
};

// ============================================================================
// Platforms
// ============================================================================

const PLATFORMS = {
  windows: ['Win32', 'Windows'],
  mac: ['MacIntel', 'Macintosh'],
  linux: ['Linux x86_64', 'Linux']
};

// ============================================================================
// Locales (Common Real-World Locales)
// NOTE: Disabled to prevent translation triggers - always using en-US
// ============================================================================

// const LOCALES = [
//   'en-US',    // United States - Most common
//   'en-GB',    // United Kingdom
//   'en-CA',    // Canada
//   'en-AU',    // Australia
//   'de-DE',    // Germany
//   'fr-FR',    // France
//   'es-ES',    // Spain
//   'it-IT',    // Italy
//   'ja-JP',    // Japan
//   'ko-KR',    // Korea
// ];

// ============================================================================
// Languages (Browser Language Preferences)
// NOTE: Disabled to prevent translation triggers - always using ['en-US', 'en']
// ============================================================================

// const LANGUAGE_SETS: Record<string, string[]> = {
//   'en-US': ['en-US', 'en'],
//   'en-GB': ['en-GB', 'en'],
//   'en-CA': ['en-CA', 'en', 'fr-CA'],
//   'de-DE': ['de-DE', 'de', 'en'],
//   'fr-FR': ['fr-FR', 'fr', 'en'],
//   'es-ES': ['es-ES', 'es', 'en'],
//   'ja-JP': ['ja-JP', 'ja', 'en'],
// };

// ============================================================================
// BrowserFingerprint Generator
// ============================================================================

export class BrowserFingerprintGenerator {
  private currentFingerprint: BrowserFingerprint | null = null;

  /**
   * Generate a new random browser fingerprint
   */
  generateFingerprint(): BrowserFingerprint {
    // Select random user agent
    const userAgentGroup = this.selectRandomUserAgentGroup();
    const userAgent = this.selectRandom(userAgentGroup);

    // Extract platform from user agent
    const platform = this.extractPlatform(userAgent);

    // Select matching viewport
    const viewport = this.selectRandom(COMMON_VIEWPORTS);

    // Select matching screen resolution
    const screenResolution = this.selectMatchingScreenResolution(viewport);

    // Force English locale to prevent translation triggers
    // (Random locales cause Chrome to detect foreign language and trigger translation)
    const locale = 'en-US';
    const timezone = this.selectMatchingTimezone(locale);

    // Always use English language preferences
    const languages = ['en-US', 'en'];

    // Build launch options
    const launchOptions = {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process,Translate,TranslateUI',  // Disable translation features
        '--disable-web-security',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-translate',  // Disable Chrome translation feature
        '--lang=en-US',  // Force English language
        '--disable-extensions',  // Disable extensions that might enable translate
        '--disable-component-extensions-with-background-pages',
      ],
      // Chromium-specific preferences to disable translation
      chromiumSandbox: false,
      ignoreDefaultArgs: ['--enable-automation']
    };

    // Build context options
    const contextOptions = {
      viewport,
      userAgent,
      locale,
      timezoneId: timezone,
      permissions: [],
      colorScheme: 'light' as const,
      deviceScaleFactor: screenResolution.pixelRatio,
      isMobile: false,
      hasTouch: false,
      geolocation: undefined,
      extraHTTPHeaders: {
        'Accept-Language': languages.join(','),
        'Sec-CH-UA': this.generateSecChUa(userAgent),
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': `"${this.getPlatformName(platform)}"`,
      }
    };

    const fingerprint: BrowserFingerprint = {
      userAgent,
      viewport,
      platform,
      locale,
      timezone,
      screenResolution,
      languages,
      launchOptions,
      contextOptions
    };

    this.currentFingerprint = fingerprint;
    return fingerprint;
  }

  /**
   * Get current fingerprint (or generate if none exists)
   */
  getCurrentFingerprint(): BrowserFingerprint {
    if (!this.currentFingerprint) {
      return this.generateFingerprint();
    }
    return this.currentFingerprint;
  }

  /**
   * Rotate to a new fingerprint
   */
  rotateFingerprint(): BrowserFingerprint {
    return this.generateFingerprint();
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private selectRandomUserAgentGroup(): string[] {
    // Favor Chrome (most common browser ~65%)
    const rand = Math.random();
    if (rand < 0.65) {
      // Chrome
      const chromeGroups = [USER_AGENTS.chrome_windows, USER_AGENTS.chrome_mac, USER_AGENTS.chrome_linux];
      return this.selectRandom(chromeGroups);
    } else if (rand < 0.75) {
      // Edge
      return USER_AGENTS.edge_windows;
    } else if (rand < 0.90) {
      // Firefox
      return Math.random() < 0.7 ? USER_AGENTS.firefox_windows : USER_AGENTS.firefox_mac;
    } else {
      // Safari
      return USER_AGENTS.safari_mac;
    }
  }

  private extractPlatform(userAgent: string): string {
    if (userAgent.includes('Windows')) {
      return this.selectRandom(PLATFORMS.windows);
    } else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS X')) {
      return this.selectRandom(PLATFORMS.mac);
    } else if (userAgent.includes('Linux')) {
      return this.selectRandom(PLATFORMS.linux);
    }
    return 'Win32';
  }

  private selectMatchingScreenResolution(viewport: Viewport): ScreenResolution {
    // Find screen resolutions that match or are larger than viewport
    const matching = SCREEN_RESOLUTIONS.filter(
      screen => screen.width >= viewport.width && screen.height >= viewport.height
    );

    if (matching.length === 0) {
      // Fallback: create matching screen
      return {
        width: viewport.width,
        height: viewport.height,
        colorDepth: 24,
        pixelRatio: 1
      };
    }

    return this.selectRandom(matching);
  }

  private selectMatchingTimezone(locale: string): string {
    // Map locales to likely timezones
    const timezoneMap: Record<string, string[]> = {
      'en-US': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
      'en-CA': ['America/Toronto', 'America/Vancouver'],
      'en-GB': ['Europe/London'],
      'de-DE': ['Europe/Berlin'],
      'fr-FR': ['Europe/Paris'],
      'es-ES': ['Europe/Madrid'],
      'ja-JP': ['Asia/Tokyo'],
      'ko-KR': ['Asia/Seoul'],
      'en-AU': ['Australia/Sydney'],
    };

    const possibleTimezones = timezoneMap[locale] || ['America/New_York'];
    return this.selectRandom(possibleTimezones);
  }

  private generateSecChUa(userAgent: string): string {
    // Extract Chrome version from user agent
    const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
      const version = chromeMatch[1];
      return `"Not_A Brand";v="8", "Chromium";v="${version}", "Google Chrome";v="${version}"`;
    }

    const edgeMatch = userAgent.match(/Edg\/(\d+)/);
    if (edgeMatch) {
      const version = edgeMatch[1];
      return `"Not_A Brand";v="8", "Chromium";v="${version}", "Microsoft Edge";v="${version}"`;
    }

    return `"Not_A Brand";v="99"`;
  }

  private getPlatformName(platform: string): string {
    if (platform.includes('Win')) return 'Windows';
    if (platform.includes('Mac')) return 'macOS';
    if (platform.includes('Linux')) return 'Linux';
    return 'Unknown';
  }

  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
