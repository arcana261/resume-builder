/**
 * Stealth Manager
 *
 * Orchestrates stealth patches and scripts to avoid detection.
 */

import type { BrowserContext, Page } from 'playwright';
import type { StealthConfig, StealthReport, IStealthManager } from '../types.js';
import * as StealthScripts from './StealthScripts.js';
import { logger } from '../../../utils/logger.js';

export class StealthManager implements IStealthManager {
  private config: StealthConfig;

  constructor(config: StealthConfig) {
    this.config = config;
    logger.info('StealthManager initialized', { config });
  }

  /**
   * Apply all stealth patches to browser context
   */
  async applyStealthPatches(context: BrowserContext): Promise<void> {
    logger.debug('Applying stealth patches to browser context');

    // Build combined stealth script based on configuration
    let stealthScript = '';

    if (this.config.hideWebDriver) {
      stealthScript += StealthScripts.hideWebDriverScript() + '\n';
    }

    if (this.config.injectChrome) {
      stealthScript += StealthScripts.injectChromeObjectScript() + '\n';
    }

    if (this.config.overridePermissions) {
      stealthScript += StealthScripts.overridePermissionsScript() + '\n';
    }

    if (this.config.patchNavigator) {
      stealthScript += StealthScripts.patchNavigatorScript() + '\n';
    }

    if (this.config.hideAutomation) {
      stealthScript += StealthScripts.hideAutomationScript() + '\n';
    }

    // Always add battery API and media codecs for realism
    stealthScript += StealthScripts.addBatteryApiScript() + '\n';
    stealthScript += StealthScripts.addMediaCodecsScript() + '\n';
    stealthScript += StealthScripts.patchDateTimeScript() + '\n';

    // Inject combined script
    if (stealthScript) {
      await context.addInitScript(stealthScript);
      logger.debug('Stealth scripts injected into browser context');
    }
  }

  /**
   * Inject stealth scripts into a specific page
   * (Called after page creation if needed)
   */
  async injectStealthScripts(_page: Page): Promise<void> {
    logger.debug('Injecting stealth scripts into page');

    // Add any page-specific stealth measures here
    // Currently, all measures are applied at context level via addInitScript

    // Could add dynamic script injection if needed:
    // await page.evaluateOnNewDocument(...);
  }

  /**
   * Validate stealth implementation by running tests
   */
  async validateStealth(page: Page): Promise<StealthReport> {
    logger.debug('Validating stealth implementation');

    try {
      const results = await page.evaluate(() => {
        const report = {
          webdriverDetected: false,
          automationDetected: false,
          tests: {} as Record<string, boolean>
        };

        // Test 1: Check navigator.webdriver
        try {
          report.tests['navigator.webdriver'] = navigator.webdriver === false;
          if (navigator.webdriver === true) {
            report.webdriverDetected = true;
          }
        } catch (e) {
          report.tests['navigator.webdriver'] = false;
        }

        // Test 2: Check for chrome object
        try {
          report.tests['window.chrome'] = typeof (window as any).chrome === 'object';
        } catch (e) {
          report.tests['window.chrome'] = false;
        }

        // Test 3: Check plugins
        try {
          report.tests['navigator.plugins'] = navigator.plugins.length > 0;
        } catch (e) {
          report.tests['navigator.plugins'] = false;
        }

        // Test 4: Check languages
        try {
          report.tests['navigator.languages'] = Array.isArray(navigator.languages) && navigator.languages.length > 0;
        } catch (e) {
          report.tests['navigator.languages'] = false;
        }

        // Test 5: Check permissions API
        try {
          report.tests['permissions.query'] = typeof navigator.permissions?.query === 'function';
        } catch (e) {
          report.tests['permissions.query'] = false;
        }

        // Test 6: Check for automation markers
        try {
          const hasAutomationMarkers =
            (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array ||
            (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise ||
            (window as any).__webdriver_script_fn;

          report.tests['automation_markers'] = !hasAutomationMarkers;
          if (hasAutomationMarkers) {
            report.automationDetected = true;
          }
        } catch (e) {
          report.tests['automation_markers'] = true;
        }

        // Test 7: Check battery API
        try {
          report.tests['battery_api'] = typeof (navigator as any).getBattery === 'function';
        } catch (e) {
          report.tests['battery_api'] = false;
        }

        // Test 8: Check connection API
        try {
          report.tests['connection_api'] = typeof (navigator as any).connection === 'object';
        } catch (e) {
          report.tests['connection_api'] = false;
        }

        return report;
      });

      // Calculate overall rating
      const totalTests = Object.keys(results.tests).length;
      const passedTests = Object.values(results.tests).filter(v => v === true).length;
      const passPercentage = (passedTests / totalTests) * 100;

      let overallRating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
      if (passPercentage >= 90) {
        overallRating = 'EXCELLENT';
      } else if (passPercentage >= 75) {
        overallRating = 'GOOD';
      } else if (passPercentage >= 60) {
        overallRating = 'FAIR';
      } else {
        overallRating = 'POOR';
      }

      const report: StealthReport = {
        webdriverDetected: results.webdriverDetected,
        automationDetected: results.automationDetected,
        fingerprintConsistency: passPercentage >= 75,
        overallRating
      };

      logger.info('Stealth validation completed', {
        rating: overallRating,
        passed: passedTests,
        total: totalTests,
        percentage: passPercentage.toFixed(1) + '%',
        webdriverDetected: results.webdriverDetected,
        automationDetected: results.automationDetected
      });

      return report;
    } catch (error) {
      logger.error('Stealth validation failed', { error });

      return {
        webdriverDetected: true,
        automationDetected: true,
        fingerprintConsistency: false,
        overallRating: 'POOR'
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): StealthConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StealthConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Stealth configuration updated', { newConfig: this.config });
  }
}
