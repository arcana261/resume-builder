/**
 * Anti-Detection System Types
 *
 * Core type definitions for the anti-detection architecture
 */

import type { BrowserContext, Page } from 'playwright';

// ============================================================================
// Fingerprint Types
// ============================================================================

export interface Viewport {
  width: number;
  height: number;
}

export interface ScreenResolution {
  width: number;
  height: number;
  colorDepth: number;
  pixelRatio: number;
}

export interface BrowserFingerprint {
  userAgent: string;
  viewport: Viewport;
  platform: string;
  locale: string;
  timezone: string;
  screenResolution: ScreenResolution;
  languages: string[];
  launchOptions: any;
  contextOptions: any;
}

export interface FingerprintConfig {
  randomizeViewport: boolean;
  randomizeUserAgent: boolean;
  randomizeLocale: boolean;
  randomizeTimezone: boolean;
  randomizeCanvas: boolean;
  randomizeWebGL: boolean;
  randomizeAudio: boolean;
  randomizeFonts: boolean;
}

// ============================================================================
// Behavior Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface MouseMovementConfig {
  enabled: boolean;
  curviness: number;          // 0-1, how curved the mouse path is
  steps: number;              // Number of intermediate points
  durationMin: number;        // Minimum movement duration in ms
  durationMax: number;        // Maximum movement duration in ms
}

export interface ScrollConfig {
  enabled: boolean;
  randomScrolls: boolean;     // Random scrolling during page viewing
  scrollBeforeAction: boolean; // Scroll element into view before clicking
  minScrolls: number;
  maxScrolls: number;
  scrollDistanceMin: number;  // Minimum scroll distance in pixels
  scrollDistanceMax: number;  // Maximum scroll distance in pixels
  scrollDurationMin: number;  // Minimum scroll duration in ms
  scrollDurationMax: number;  // Maximum scroll duration in ms
}

export interface ReadingTimeConfig {
  enabled: boolean;
  baseWPM: number;            // Words per minute reading speed
  variability: number;        // 0-1, how much to vary reading time
  minReadingTime: number;     // Minimum reading time in ms
  maxReadingTime: number;     // Maximum reading time in ms
}

export interface HoverConfig {
  enabled: boolean;
  hoverBeforeClick: boolean;  // Hover before clicking
  hoverDurationMin: number;   // Minimum hover duration in ms
  hoverDurationMax: number;   // Maximum hover duration in ms
  hoverProbability: number;   // 0-1, probability of hovering
}

export interface BehaviorConfig {
  enableMouseMovement: boolean;
  enableScrollSimulation: boolean;
  enableReadingTime: boolean;
  enableTypingSimulation: boolean;
  humanLikeDelays: boolean;
  mouseMovement?: MouseMovementConfig;
  scroll?: ScrollConfig;
  readingTime?: ReadingTimeConfig;
  hover?: HoverConfig;
}

// ============================================================================
// Network Types
// ============================================================================

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  protocol?: 'http' | 'https' | 'socks5';
}

export interface NetworkConfig {
  enableProxyRotation: boolean;
  proxyPool?: ProxyConfig[];
  randomizeHeaders: boolean;
  manageCookies: boolean;
  persistSessions: boolean;
}

// ============================================================================
// Stealth Types
// ============================================================================

export interface StealthConfig {
  hideWebDriver: boolean;
  injectChrome: boolean;
  overridePermissions: boolean;
  patchNavigator: boolean;
  hideAutomation: boolean;
}

export interface StealthReport {
  webdriverDetected: boolean;
  automationDetected: boolean;
  fingerprintConsistency: boolean;
  overallRating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
}

// ============================================================================
// Timing Types
// ============================================================================

export interface TimingConfig {
  requestDelayMin: number;
  requestDelayMax: number;
  pageDelayMin: number;
  pageDelayMax: number;
  readingTimeMultiplier: number;
  randomizeTimings: boolean;
}

// ============================================================================
// Detection Types
// ============================================================================

export type DetectionType = 'captcha' | 'block' | 'rate_limit' | 'ban' | 'suspicious';
export type DetectionSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DetectionSignal {
  type: DetectionType;
  severity: DetectionSeverity;
  timestamp: Date;
  details: any;
}

export interface DetectionConfig {
  enableMonitoring: boolean;
  adaptiveStrategies: boolean;
  logDetectionEvents: boolean;
  alertOnCritical: boolean;
}

// ============================================================================
// ML Pattern Types
// ============================================================================

export interface MLConfig {
  enabled: boolean;
  autoLearn: boolean;
  dataDirectory?: string;
  enableTimingPrediction: boolean;
  enableBehaviorPrediction: boolean;
  enableAnomalyDetection: boolean;
}

// ============================================================================
// Main Configuration
// ============================================================================

export interface AntiDetectionConfig {
  fingerprint: FingerprintConfig;
  behavior: BehaviorConfig;
  network: NetworkConfig;
  stealth: StealthConfig;
  timing: TimingConfig;
  detection: DetectionConfig;
  ml?: MLConfig;
}

// ============================================================================
// Manager Interfaces
// ============================================================================

export interface IFingerprintManager {
  generateFingerprint(): BrowserFingerprint;
  applyFingerprint(context: BrowserContext, fingerprint: BrowserFingerprint): Promise<void>;
  rotateFingerprint(): BrowserFingerprint;
}

export interface IStealthManager {
  applyStealthPatches(context: BrowserContext): Promise<void>;
  injectStealthScripts(page: Page): Promise<void>;
  validateStealth(page: Page): Promise<StealthReport>;
}

export interface IBehaviorManager {
  simulateMouseMovement(page: Page, from: Point, to: Point): Promise<void>;
  simulateScrolling(page: Page, distance?: number): Promise<void>;
  simulateReadingTime(page: Page, contentLength?: number): Promise<void>;
  simulateHover(page: Page, selector: string): Promise<void>;
  beforeNavigate(page: Page, url: string): Promise<void>;
  afterNavigate(page: Page, url: string): Promise<void>;
  beforeClick(page: Page, selector: string): Promise<void>;
  afterClick(page: Page): Promise<void>;
}

export interface IAntiDetectionManager {
  generateFingerprint(): BrowserFingerprint;
  applyStealth(context: BrowserContext): Promise<void>;
  beforeNavigate(page: Page, url: string): Promise<void>;
  afterNavigate(page: Page, url: string): Promise<void>;
  beforeClick(page: Page, selector: string): Promise<void>;
  afterClick(page: Page): Promise<void>;
}
