/**
 * Anti-Detection Manager
 *
 * Main orchestrator for all anti-detection measures.
 * Coordinates fingerprinting, stealth patches, behavioral simulation, and detection monitoring.
 */

import type { BrowserContext, Page, Response } from 'playwright';
import type {
  AntiDetectionConfig,
  BrowserFingerprint,
  IAntiDetectionManager,
  StealthReport
} from './types.js';
import { FingerprintManager } from './fingerprint/FingerprintManager.js';
import { StealthManager } from './stealth/StealthManager.js';
import { BehaviorManager } from './behavior/BehaviorManager.js';
import { NetworkManager } from './network/NetworkManager.js';
import { DetectionMonitor } from './detection/DetectionMonitor.js';
import { MLPatternAnalyzer } from './ml/MLPatternAnalyzer.js';
import type { BehaviorAction } from './ml/BehaviorPatternRecognizer.js';
import { logger } from '../../utils/logger.js';

/**
 * Default configuration for anti-detection
 */
const DEFAULT_CONFIG: AntiDetectionConfig = {
  fingerprint: {
    randomizeViewport: true,
    randomizeUserAgent: true,
    randomizeLocale: true,
    randomizeTimezone: true,
    randomizeCanvas: true,
    randomizeWebGL: true,
    randomizeAudio: true,
    randomizeFonts: true
  },

  behavior: {
    enableMouseMovement: true,
    enableScrollSimulation: true,
    enableReadingTime: true,
    enableTypingSimulation: false,
    humanLikeDelays: true
  },

  network: {
    enableProxyRotation: false,  // Disabled by default (requires proxy configuration)
    proxyPool: [],
    randomizeHeaders: true,
    manageCookies: true,
    persistSessions: false  // Disabled by default (privacy concern)
  },

  stealth: {
    hideWebDriver: true,
    injectChrome: true,
    overridePermissions: true,
    patchNavigator: true,
    hideAutomation: true
  },

  timing: {
    requestDelayMin: 3000,
    requestDelayMax: 7000,
    pageDelayMin: 1500,
    pageDelayMax: 3000,
    readingTimeMultiplier: 1.0,
    randomizeTimings: true
  },

  detection: {
    enableMonitoring: true,
    adaptiveStrategies: true,
    logDetectionEvents: true,
    alertOnCritical: false
  },

  ml: {
    enabled: true,
    autoLearn: true,
    dataDirectory: './data/training',
    enableTimingPrediction: true,
    enableBehaviorPrediction: true,
    enableAnomalyDetection: true
  }
};

export class AntiDetectionManager implements IAntiDetectionManager {
  private config: AntiDetectionConfig;
  private fingerprintManager: FingerprintManager;
  private stealthManager: StealthManager;
  private behaviorManager: BehaviorManager;
  private networkManager: NetworkManager;
  private detectionMonitor: DetectionMonitor;
  private mlAnalyzer: MLPatternAnalyzer | null = null;
  private enabled: boolean = true;

  constructor(config?: Partial<AntiDetectionConfig>) {
    // Merge provided config with defaults
    this.config = this.mergeConfig(DEFAULT_CONFIG, config || {});

    // Initialize managers
    this.fingerprintManager = new FingerprintManager(this.config.fingerprint);
    this.stealthManager = new StealthManager(this.config.stealth);
    this.behaviorManager = new BehaviorManager(this.config.behavior);
    this.networkManager = new NetworkManager(this.config.network);
    this.detectionMonitor = new DetectionMonitor(this.config.detection);

    // Initialize ML analyzer if enabled
    if (this.config.ml?.enabled) {
      this.mlAnalyzer = new MLPatternAnalyzer(this.config.ml);
    }

    logger.info('AntiDetectionManager initialized', {
      enabled: this.enabled,
      fingerprintRandomization: this.config.fingerprint.randomizeUserAgent,
      stealthEnabled: this.config.stealth.hideWebDriver,
      behaviorSimulation: this.config.behavior.enableMouseMovement || this.config.behavior.enableScrollSimulation,
      networkManagement: this.config.network.randomizeHeaders || this.config.network.enableProxyRotation,
      detectionMonitoring: this.config.detection.enableMonitoring,
      mlPatterns: this.config.ml?.enabled || false
    });
  }

  /**
   * Initialize async components (ML analyzer)
   * Call this after construction for full initialization
   */
  async initialize(): Promise<void> {
    if (this.mlAnalyzer) {
      await this.mlAnalyzer.initialize();
      logger.info('AntiDetectionManager fully initialized with ML patterns');
    }
  }

  /**
   * Generate a new browser fingerprint
   */
  generateFingerprint(): BrowserFingerprint {
    if (!this.enabled) {
      logger.warn('Anti-detection is disabled, using minimal fingerprint');
    }

    return this.fingerprintManager.generateFingerprint();
  }

  /**
   * Apply stealth patches to browser context
   */
  async applyStealth(context: BrowserContext): Promise<void> {
    if (!this.enabled) {
      logger.warn('Anti-detection is disabled, skipping stealth patches');
      return;
    }

    // Apply stealth patches
    await this.stealthManager.applyStealthPatches(context);

    // Apply fingerprint to context
    const fingerprint = this.fingerprintManager.getCurrentFingerprint();
    await this.fingerprintManager.applyFingerprint(context, fingerprint);

    // Apply network headers
    await this.networkManager.applyHeaders(context);

    // Load cookies and session data
    const fingerprintId = this.generateFingerprintId(fingerprint);
    await this.networkManager.loadCookies(context, fingerprintId);

    logger.info('Anti-detection measures applied to browser context');
  }

  /**
   * Hook called before navigation
   */
  async beforeNavigate(page: Page, url: string): Promise<void> {
    if (!this.enabled) return;

    logger.debug('Before navigate hook', { url });

    // Delegate to behavior manager
    await this.behaviorManager.beforeNavigate(page, url);
  }

  /**
   * Hook called after navigation
   */
  async afterNavigate(page: Page, url: string): Promise<void> {
    if (!this.enabled) return;

    logger.debug('After navigate hook', { url });

    // Delegate to behavior manager
    await this.behaviorManager.afterNavigate(page, url);
  }

  /**
   * Hook called before clicking an element
   */
  async beforeClick(page: Page, selector: string): Promise<void> {
    if (!this.enabled) return;

    logger.debug('Before click hook', { selector });

    // Delegate to behavior manager
    await this.behaviorManager.beforeClick(page, selector);
  }

  /**
   * Hook called after clicking an element
   */
  async afterClick(page: Page): Promise<void> {
    if (!this.enabled) return;

    logger.debug('After click hook');

    // Delegate to behavior manager
    await this.behaviorManager.afterClick(page);
  }

  /**
   * Validate stealth implementation
   */
  async validateStealth(page: Page): Promise<StealthReport> {
    return await this.stealthManager.validateStealth(page);
  }

  /**
   * Rotate fingerprint to a new one
   */
  rotateFingerprint(): BrowserFingerprint {
    logger.info('Rotating browser fingerprint');
    return this.fingerprintManager.rotateFingerprint();
  }

  /**
   * Enable anti-detection measures
   */
  enable(): void {
    this.enabled = true;
    logger.info('Anti-detection enabled');
  }

  /**
   * Disable anti-detection measures
   */
  disable(): void {
    this.enabled = false;
    logger.warn('Anti-detection disabled');
  }

  /**
   * Check if anti-detection is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): AntiDetectionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (partial update)
   */
  updateConfig(config: Partial<AntiDetectionConfig>): void {
    this.config = this.mergeConfig(this.config, config);

    // Update sub-managers
    if (config.stealth) {
      this.stealthManager.updateConfig(config.stealth);
    }

    logger.info('Anti-detection configuration updated');
  }

  /**
   * Get fingerprint manager (for advanced usage)
   */
  getFingerprintManager(): FingerprintManager {
    return this.fingerprintManager;
  }

  /**
   * Get stealth manager (for advanced usage)
   */
  getStealthManager(): StealthManager {
    return this.stealthManager;
  }

  /**
   * Get behavior manager (for advanced usage)
   */
  getBehaviorManager(): BehaviorManager {
    return this.behaviorManager;
  }

  /**
   * Get network manager (for advanced usage)
   */
  getNetworkManager(): NetworkManager {
    return this.networkManager;
  }

  /**
   * Get detection monitor (for advanced usage)
   */
  getDetectionMonitor(): DetectionMonitor {
    return this.detectionMonitor;
  }

  /**
   * Check page for detection signals
   */
  async checkForDetection(page: Page, response: Response | null = null) {
    return await this.detectionMonitor.checkForDetection(page, response);
  }

  /**
   * Get adaptive delay based on detection history
   */
  getAdaptiveDelay(baseDelay: number): number {
    return this.detectionMonitor.getAdaptiveDelay(baseDelay);
  }

  /**
   * Should abort current operation due to detections?
   */
  shouldAbortDueToDetection(): boolean {
    return this.detectionMonitor.shouldAbort();
  }

  /**
   * Save session data (cookies, storage)
   */
  async saveSession(context: BrowserContext, page?: Page): Promise<void> {
    const fingerprint = this.fingerprintManager.getCurrentFingerprint();
    const fingerprintId = this.generateFingerprintId(fingerprint);

    await this.networkManager.saveCookies(context, fingerprintId);

    if (page) {
      await this.networkManager.saveStorageData(page, fingerprintId);
    }

    logger.debug('Session data saved');
  }

  /**
   * Get ML pattern analyzer (for advanced usage)
   */
  getMLAnalyzer(): MLPatternAnalyzer | null {
    return this.mlAnalyzer;
  }

  /**
   * Start ML learning session
   */
  startMLSession(sessionId: string): void {
    if (this.mlAnalyzer) {
      this.mlAnalyzer.startSession(sessionId);
    }
  }

  /**
   * End ML learning session
   */
  async endMLSession(successful: boolean): Promise<void> {
    if (this.mlAnalyzer) {
      await this.mlAnalyzer.endSession(successful);
    }
  }

  /**
   * Record behavior action for ML learning
   */
  recordMLBehavior(action: BehaviorAction): void {
    if (this.mlAnalyzer) {
      this.mlAnalyzer.recordBehaviorAction(action);
    }
  }

  /**
   * Get ML-predicted delay for an action
   */
  getMLPredictedDelay(actionType: 'navigation' | 'click' | 'scroll' | 'typing' | 'hover', baseDelay: number = 1000): number {
    if (this.mlAnalyzer && this.config.ml?.enableTimingPrediction) {
      return this.mlAnalyzer.predictDelay(actionType, baseDelay);
    }
    return baseDelay;
  }

  /**
   * Check metrics for anomalies using ML
   */
  checkMLAnomalies(metrics: Record<string, number>): Map<string, any> {
    if (this.mlAnalyzer && this.config.ml?.enableAnomalyDetection) {
      return this.mlAnalyzer.checkMetrics(metrics);
    }
    return new Map();
  }

  /**
   * Shutdown - cleanup all managers
   */
  async shutdown(): Promise<void> {
    if (this.mlAnalyzer) {
      await this.mlAnalyzer.shutdown();
    }
    logger.info('AntiDetectionManager shutdown complete');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Deep merge two configuration objects
   */
  private mergeConfig(base: AntiDetectionConfig, override: Partial<AntiDetectionConfig>): AntiDetectionConfig {
    const result: AntiDetectionConfig = {
      fingerprint: { ...base.fingerprint, ...(override.fingerprint || {}) },
      behavior: { ...base.behavior, ...(override.behavior || {}) },
      network: { ...base.network, ...(override.network || {}) },
      stealth: { ...base.stealth, ...(override.stealth || {}) },
      timing: { ...base.timing, ...(override.timing || {}) },
      detection: { ...base.detection, ...(override.detection || {}) }
    };

    // Merge ML config if present
    if (base.ml || override.ml) {
      result.ml = { ...(base.ml || {} as any), ...(override.ml || {} as any) };
    }

    return result;
  }

  /**
   * Generate a unique fingerprint ID for session storage
   */
  private generateFingerprintId(fingerprint: BrowserFingerprint): string {
    // Create a simple hash from fingerprint properties
    const key = `${fingerprint.userAgent}_${fingerprint.locale}_${fingerprint.viewport.width}x${fingerprint.viewport.height}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `fp_${Math.abs(hash).toString(16)}`;
  }
}

/**
 * Create a default anti-detection manager instance
 */
export function createAntiDetectionManager(config?: Partial<AntiDetectionConfig>): AntiDetectionManager {
  return new AntiDetectionManager(config);
}

/**
 * Export default configuration for reference
 */
export { DEFAULT_CONFIG };
