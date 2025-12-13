/**
 * Fingerprint Manager
 *
 * Orchestrates browser fingerprint generation, application, and rotation.
 */

import type { BrowserContext } from 'playwright';
import type { BrowserFingerprint, FingerprintConfig, IFingerprintManager } from '../types.js';
import { BrowserFingerprintGenerator } from './BrowserFingerprint.js';
import { generateAdvancedFingerprintScript } from './advanced/AdvancedFingerprintScripts.js';
import { logger } from '../../../utils/logger.js';

export class FingerprintManager implements IFingerprintManager {
  private generator: BrowserFingerprintGenerator;
  private config: FingerprintConfig;
  private currentFingerprint: BrowserFingerprint | null = null;
  private fingerprintRotationCount: number = 0;

  constructor(config: FingerprintConfig) {
    this.config = config;
    this.generator = new BrowserFingerprintGenerator();

    logger.info('FingerprintManager initialized', { config });
  }

  /**
   * Generate a new browser fingerprint
   */
  generateFingerprint(): BrowserFingerprint {
    const fingerprint = this.generator.generateFingerprint();
    this.currentFingerprint = fingerprint;

    logger.info('Generated new fingerprint', {
      userAgent: fingerprint.userAgent.substring(0, 50) + '...',
      viewport: fingerprint.viewport,
      platform: fingerprint.platform,
      locale: fingerprint.locale,
      timezone: fingerprint.timezone
    });

    return fingerprint;
  }

  /**
   * Apply fingerprint to browser context
   */
  async applyFingerprint(context: BrowserContext, fingerprint: BrowserFingerprint): Promise<void> {
    logger.debug('Applying fingerprint to browser context');

    // Note: Most fingerprint application happens during context creation
    // This method is for any additional runtime modifications

    // Apply screen resolution via script injection
    if (this.config.randomizeViewport) {
      await context.addInitScript((screenRes) => {
        Object.defineProperty(window.screen, 'width', {
          get: () => screenRes.width
        });
        Object.defineProperty(window.screen, 'height', {
          get: () => screenRes.height
        });
        Object.defineProperty(window.screen, 'availWidth', {
          get: () => screenRes.width
        });
        Object.defineProperty(window.screen, 'availHeight', {
          get: () => screenRes.height - 40  // Subtract taskbar height
        });
        Object.defineProperty(window.screen, 'colorDepth', {
          get: () => screenRes.colorDepth
        });
        Object.defineProperty(window.screen, 'pixelDepth', {
          get: () => screenRes.colorDepth
        });
      }, fingerprint.screenResolution);
    }

    // Apply language preferences
    if (this.config.randomizeLocale) {
      await context.addInitScript((languages) => {
        Object.defineProperty(navigator, 'languages', {
          get: () => languages
        });
        Object.defineProperty(navigator, 'language', {
          get: () => languages[0]
        });
      }, fingerprint.languages);
    }

    // Apply platform
    await context.addInitScript((platform) => {
      Object.defineProperty(navigator, 'platform', {
        get: () => platform
      });
    }, fingerprint.platform);

    // Apply hardware concurrency (CPU cores) - randomize between 4-16
    await context.addInitScript(() => {
      const cores = Math.floor(Math.random() * 13) + 4;  // 4-16 cores
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => cores
      });
    });

    // Apply device memory (GB) - randomize between 4-32
    await context.addInitScript(() => {
      const memory = [4, 8, 16, 32][Math.floor(Math.random() * 4)];
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => memory
      });
    });

    // Apply advanced fingerprinting randomization
    if (this.config.randomizeCanvas || this.config.randomizeWebGL ||
        this.config.randomizeAudio || this.config.randomizeFonts) {
      const advancedScript = generateAdvancedFingerprintScript({
        randomizeCanvas: this.config.randomizeCanvas,
        randomizeWebGL: this.config.randomizeWebGL,
        randomizeAudio: this.config.randomizeAudio,
        randomizeFonts: this.config.randomizeFonts,
        canvasNoiseLevel: 0.001,
        audioNoiseLevel: 0.0001
      });

      await context.addInitScript(advancedScript);

      logger.debug('Advanced fingerprinting applied', {
        canvas: this.config.randomizeCanvas,
        webgl: this.config.randomizeWebGL,
        audio: this.config.randomizeAudio,
        fonts: this.config.randomizeFonts
      });
    }

    logger.debug('Fingerprint applied to browser context');
  }

  /**
   * Rotate to a new fingerprint
   */
  rotateFingerprint(): BrowserFingerprint {
    this.fingerprintRotationCount++;

    logger.info('Rotating fingerprint', {
      rotationCount: this.fingerprintRotationCount
    });

    return this.generateFingerprint();
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
   * Get rotation count (for monitoring)
   */
  getRotationCount(): number {
    return this.fingerprintRotationCount;
  }

  /**
   * Reset rotation count
   */
  resetRotationCount(): void {
    this.fingerprintRotationCount = 0;
  }
}
