/**
 * Detection Monitor
 *
 * Monitors for detection signals and implements adaptive strategies:
 * - CAPTCHA detection
 * - Rate limit detection
 * - Block detection
 * - Suspicious behavior detection
 * - Adaptive response strategies
 */

import type { Page, Response } from 'playwright';
import type { DetectionConfig, DetectionSignal, DetectionType, DetectionSeverity } from '../types.js';
import { logger } from '../../../utils/logger.js';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  enableMonitoring: true,
  adaptiveStrategies: true,
  logDetectionEvents: true,
  alertOnCritical: false
};

// ============================================================================
// Detection Patterns
// ============================================================================

const CAPTCHA_PATTERNS = {
  // Common CAPTCHA services
  selectors: [
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    'iframe[src*="captcha"]',
    '#captcha',
    '.captcha',
    '[class*="captcha"]',
    '[id*="captcha"]',
    'div[data-sitekey]',  // reCAPTCHA v3
    '.g-recaptcha',
    '.h-captcha'
  ],

  // CAPTCHA-related text
  textPatterns: [
    /verify you('re| are) (a )?human/i,
    /complete (the )?captcha/i,
    /prove you('re| are) not a (robot|bot)/i,
    /security (check|verification)/i,
    /unusual (activity|traffic)/i,
    /automated (requests|behavior)/i
  ],

  // CAPTCHA URLs
  urlPatterns: [
    /recaptcha/i,
    /hcaptcha/i,
    /captcha/i,
    /challenge/i
  ]
};

const RATE_LIMIT_PATTERNS = {
  // HTTP status codes
  statusCodes: [429, 403, 503],

  // Rate limit text
  textPatterns: [
    /too many requests/i,
    /rate limit exceeded/i,
    /slow down/i,
    /try again later/i,
    /temporarily (blocked|unavailable)/i,
    /service unavailable/i,
    /quota exceeded/i
  ],

  // Response headers
  headers: [
    'retry-after',
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset'
  ]
};

const BLOCK_PATTERNS = {
  // HTTP status codes
  statusCodes: [403, 401, 406, 451],

  // Block text
  textPatterns: [
    /access denied/i,
    /you('ve| have) been blocked/i,
    /your (ip|account) has been (blocked|banned)/i,
    /this (page|site) is (not available|blocked)/i,
    /unauthorized/i,
    /forbidden/i,
    /suspicious activity detected/i
  ],

  // Cloudflare/Anti-bot services
  servicePatterns: [
    /cloudflare/i,
    /please enable (cookies|javascript)/i,
    /checking (if the site|your browser)/i,
    /enable javascript and cookies/i,
    /ray id/i  // Cloudflare Ray ID
  ]
};

// ============================================================================
// DetectionMonitor Implementation
// ============================================================================

export class DetectionMonitor {
  private config: DetectionConfig;
  private detectionHistory: DetectionSignal[] = [];
  private consecutiveDetections: number = 0;
  private lastDetectionTime: number = 0;
  private adaptiveDelayMultiplier: number = 1.0;
  private maxHistorySize: number = 100;

  constructor(config?: Partial<DetectionConfig>) {
    this.config = { ...DEFAULT_DETECTION_CONFIG, ...config };

    logger.debug('[Detection] DetectionMonitor initialized', {
      monitoring: this.config.enableMonitoring,
      adaptive: this.config.adaptiveStrategies
    });
  }

  // ============================================================================
  // Detection Methods
  // ============================================================================

  /**
   * Check page for CAPTCHA
   */
  async detectCaptcha(page: Page): Promise<boolean> {
    if (!this.config.enableMonitoring) {
      return false;
    }

    try {
      // Check for CAPTCHA selectors
      for (const selector of CAPTCHA_PATTERNS.selectors) {
        const element = await page.$(selector);
        if (element) {
          await this.recordDetection('captcha', 'high', {
            selector,
            url: page.url()
          });
          return true;
        }
      }

      // Check page text for CAPTCHA patterns
      const pageText = await page.evaluate(() => document.body.textContent || '');
      for (const pattern of CAPTCHA_PATTERNS.textPatterns) {
        if (pattern.test(pageText)) {
          await this.recordDetection('captcha', 'high', {
            pattern: pattern.toString(),
            url: page.url()
          });
          return true;
        }
      }

      // Check URL for CAPTCHA patterns
      const url = page.url();
      for (const pattern of CAPTCHA_PATTERNS.urlPatterns) {
        if (pattern.test(url)) {
          await this.recordDetection('captcha', 'high', {
            url,
            pattern: pattern.toString()
          });
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.warn('[Detection] CAPTCHA detection failed', { error });
      return false;
    }
  }

  /**
   * Check response for rate limiting
   */
  async detectRateLimit(response: Response | null): Promise<boolean> {
    if (!this.config.enableMonitoring || !response) {
      return false;
    }

    try {
      const status = response.status();
      const headers = response.headers();
      const url = response.url();

      // Check status codes
      if (RATE_LIMIT_PATTERNS.statusCodes.includes(status)) {
        await this.recordDetection('rate_limit', status === 429 ? 'critical' : 'high', {
          status,
          url,
          retryAfter: headers['retry-after']
        });
        return true;
      }

      // Check for rate limit headers
      for (const header of RATE_LIMIT_PATTERNS.headers) {
        if (headers[header]) {
          await this.recordDetection('rate_limit', 'medium', {
            header,
            value: headers[header],
            url
          });
          return true;
        }
      }

      // Check response text for rate limit patterns
      try {
        const text = await response.text();
        for (const pattern of RATE_LIMIT_PATTERNS.textPatterns) {
          if (pattern.test(text)) {
            await this.recordDetection('rate_limit', 'high', {
              pattern: pattern.toString(),
              url
            });
            return true;
          }
        }
      } catch (e) {
        // Response body may not be available
      }

      return false;
    } catch (error) {
      logger.warn('[Detection] Rate limit detection failed', { error });
      return false;
    }
  }

  /**
   * Check page for blocking
   */
  async detectBlock(page: Page, response: Response | null): Promise<boolean> {
    if (!this.config.enableMonitoring) {
      return false;
    }

    try {
      // Check response status
      if (response) {
        const status = response.status();
        if (BLOCK_PATTERNS.statusCodes.includes(status)) {
          await this.recordDetection('block', 'critical', {
            status,
            url: page.url()
          });
          return true;
        }
      }

      // Check page text for block patterns
      const pageText = await page.evaluate(() => document.body.textContent || '');

      for (const pattern of BLOCK_PATTERNS.textPatterns) {
        if (pattern.test(pageText)) {
          await this.recordDetection('block', 'critical', {
            pattern: pattern.toString(),
            url: page.url()
          });
          return true;
        }
      }

      // Check for anti-bot services
      for (const pattern of BLOCK_PATTERNS.servicePatterns) {
        if (pattern.test(pageText)) {
          await this.recordDetection('block', 'high', {
            service: 'cloudflare_or_similar',
            pattern: pattern.toString(),
            url: page.url()
          });
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.warn('[Detection] Block detection failed', { error });
      return false;
    }
  }

  /**
   * Detect suspicious patterns (empty results, unusual response times, etc.)
   */
  async detectSuspiciousBehavior(page: Page, metrics?: {
    responseTime?: number;
    elementCount?: number;
    expectedElements?: number;
  }): Promise<boolean> {
    if (!this.config.enableMonitoring) {
      return false;
    }

    try {
      // Check for unusually fast responses (may indicate bot detection)
      if (metrics?.responseTime && metrics.responseTime < 100) {
        await this.recordDetection('suspicious', 'low', {
          reason: 'unusually_fast_response',
          responseTime: metrics.responseTime,
          url: page.url()
        });
        return true;
      }

      // Check for unexpected empty content
      if (metrics?.elementCount !== undefined && metrics.expectedElements !== undefined) {
        if (metrics.elementCount === 0 && metrics.expectedElements > 0) {
          await this.recordDetection('suspicious', 'medium', {
            reason: 'empty_content',
            url: page.url()
          });
          return true;
        }
      }

      // Check for redirects to different domains (may indicate blocking)
      const url = page.url();
      const domain = new URL(url).hostname;
      const expectedDomain = 'linkedin.com';

      if (!domain.includes(expectedDomain)) {
        await this.recordDetection('suspicious', 'medium', {
          reason: 'unexpected_redirect',
          currentDomain: domain,
          expectedDomain,
          url
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.warn('[Detection] Suspicious behavior detection failed', { error });
      return false;
    }
  }

  /**
   * Comprehensive check for all detection signals
   */
  async checkForDetection(page: Page, response: Response | null): Promise<{
    detected: boolean;
    types: DetectionType[];
    highestSeverity: DetectionSeverity | null;
  }> {
    const detectedTypes: DetectionType[] = [];

    // Run all detection checks
    const [captcha, rateLimit, block, suspicious] = await Promise.all([
      this.detectCaptcha(page),
      this.detectRateLimit(response),
      this.detectBlock(page, response),
      this.detectSuspiciousBehavior(page)
    ]);

    if (captcha) detectedTypes.push('captcha');
    if (rateLimit) detectedTypes.push('rate_limit');
    if (block) detectedTypes.push('block');
    if (suspicious) detectedTypes.push('suspicious');

    const detected = detectedTypes.length > 0;

    // Determine highest severity
    let highestSeverity: DetectionSeverity | null = null;
    if (detected && this.detectionHistory.length > 0) {
      const recentDetections = this.detectionHistory.slice(-5);
      highestSeverity = this.getHighestSeverity(recentDetections.map(d => d.severity));
    }

    return { detected, types: detectedTypes, highestSeverity };
  }

  // ============================================================================
  // Adaptive Strategies
  // ============================================================================

  /**
   * Get adaptive delay based on detection history
   */
  getAdaptiveDelay(baseDelay: number): number {
    if (!this.config.adaptiveStrategies) {
      return baseDelay;
    }

    // Increase delay based on recent detections
    const recentDetections = this.getRecentDetections(5 * 60 * 1000); // Last 5 minutes
    const detectionCount = recentDetections.length;

    if (detectionCount === 0) {
      // No recent detections, gradually reduce multiplier back to 1.0
      this.adaptiveDelayMultiplier = Math.max(1.0, this.adaptiveDelayMultiplier * 0.9);
    } else if (detectionCount >= 3) {
      // Multiple detections, increase delay significantly
      this.adaptiveDelayMultiplier = Math.min(5.0, this.adaptiveDelayMultiplier * 1.5);
    } else {
      // Some detections, increase delay moderately
      this.adaptiveDelayMultiplier = Math.min(3.0, this.adaptiveDelayMultiplier * 1.2);
    }

    const adaptiveDelay = baseDelay * this.adaptiveDelayMultiplier;

    logger.debug('[Detection] Adaptive delay calculated', {
      baseDelay,
      multiplier: this.adaptiveDelayMultiplier.toFixed(2),
      adaptiveDelay: Math.round(adaptiveDelay),
      recentDetections: detectionCount
    });

    return adaptiveDelay;
  }

  /**
   * Should we abort the current operation?
   */
  shouldAbort(): boolean {
    if (!this.config.adaptiveStrategies) {
      return false;
    }

    // Abort if we have 3+ critical detections in last 5 minutes
    const recentCritical = this.getRecentDetections(5 * 60 * 1000).filter(
      d => d.severity === 'critical'
    );

    if (recentCritical.length >= 3) {
      logger.warn('[Detection] Aborting due to multiple critical detections', {
        count: recentCritical.length
      });
      return true;
    }

    // Abort if we have 5+ consecutive detections
    if (this.consecutiveDetections >= 5) {
      logger.warn('[Detection] Aborting due to consecutive detections', {
        count: this.consecutiveDetections
      });
      return true;
    }

    return false;
  }

  /**
   * Get recommended action based on detection
   */
  getRecommendedAction(detectionType: DetectionType, severity: DetectionSeverity): string {
    if (severity === 'critical') {
      if (detectionType === 'captcha') {
        return 'abort_and_notify';
      } else if (detectionType === 'block') {
        return 'abort_and_rotate_identity';
      } else if (detectionType === 'rate_limit') {
        return 'pause_and_retry';
      }
    } else if (severity === 'high') {
      return 'increase_delays';
    } else if (severity === 'medium') {
      return 'monitor_closely';
    }

    return 'continue_with_caution';
  }

  // ============================================================================
  // Detection History Management
  // ============================================================================

  /**
   * Record a detection event
   */
  private async recordDetection(
    type: DetectionType,
    severity: DetectionSeverity,
    details: any
  ): Promise<void> {
    const signal: DetectionSignal = {
      type,
      severity,
      timestamp: new Date(),
      details
    };

    this.detectionHistory.push(signal);

    // Trim history if too large
    if (this.detectionHistory.length > this.maxHistorySize) {
      this.detectionHistory = this.detectionHistory.slice(-this.maxHistorySize);
    }

    // Update consecutive counter
    const now = Date.now();
    if (now - this.lastDetectionTime < 60000) { // Within 1 minute
      this.consecutiveDetections++;
    } else {
      this.consecutiveDetections = 1;
    }
    this.lastDetectionTime = now;

    if (this.config.logDetectionEvents) {
      logger.warn('[Detection] Detection signal recorded', {
        type,
        severity,
        details,
        consecutiveDetections: this.consecutiveDetections
      });
    }

    if (this.config.alertOnCritical && severity === 'critical') {
      logger.error('[Detection] CRITICAL detection signal', {
        type,
        details,
        recommendedAction: this.getRecommendedAction(type, severity)
      });
    }
  }

  /**
   * Get recent detections within time window
   */
  private getRecentDetections(timeWindowMs: number): DetectionSignal[] {
    const now = Date.now();
    return this.detectionHistory.filter(
      signal => now - signal.timestamp.getTime() < timeWindowMs
    );
  }

  /**
   * Get highest severity from list
   */
  private getHighestSeverity(severities: DetectionSeverity[]): DetectionSeverity {
    const order: DetectionSeverity[] = ['critical', 'high', 'medium', 'low'];
    for (const severity of order) {
      if (severities.includes(severity)) {
        return severity;
      }
    }
    return 'low';
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get all detection history
   */
  getDetectionHistory(): DetectionSignal[] {
    return [...this.detectionHistory];
  }

  /**
   * Get detection statistics
   */
  getStatistics(): {
    totalDetections: number;
    byType: Record<DetectionType, number>;
    bySeverity: Record<DetectionSeverity, number>;
    consecutiveDetections: number;
    lastDetection: Date | null;
  } {
    const byType: Record<DetectionType, number> = {
      captcha: 0,
      block: 0,
      rate_limit: 0,
      ban: 0,
      suspicious: 0
    };

    const bySeverity: Record<DetectionSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    for (const signal of this.detectionHistory) {
      byType[signal.type]++;
      bySeverity[signal.severity]++;
    }

    return {
      totalDetections: this.detectionHistory.length,
      byType,
      bySeverity,
      consecutiveDetections: this.consecutiveDetections,
      lastDetection: this.detectionHistory.length > 0
        ? this.detectionHistory[this.detectionHistory.length - 1].timestamp
        : null
    };
  }

  /**
   * Clear detection history
   */
  clearHistory(): void {
    this.detectionHistory = [];
    this.consecutiveDetections = 0;
    this.lastDetectionTime = 0;
    this.adaptiveDelayMultiplier = 1.0;
    logger.info('[Detection] History cleared');
  }

  /**
   * Get current configuration
   */
  getConfig(): DetectionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('[Detection] Configuration updated', { config: this.config });
  }
}
