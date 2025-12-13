/**
 * Anti-Detection System
 *
 * Exports for the anti-detection architecture
 */

// Main manager
export { AntiDetectionManager, createAntiDetectionManager, DEFAULT_CONFIG } from './AntiDetectionManager.js';

// Sub-managers
export { FingerprintManager } from './fingerprint/FingerprintManager.js';
export { BrowserFingerprintGenerator } from './fingerprint/BrowserFingerprint.js';
export { StealthManager } from './stealth/StealthManager.js';
export { BehaviorManager } from './behavior/BehaviorManager.js';
export { NetworkManager } from './network/NetworkManager.js';
export { DetectionMonitor } from './detection/DetectionMonitor.js';

// Advanced fingerprinting
export {
  randomizeCanvasScript,
  randomizeWebGLScript,
  randomizeAudioScript,
  randomizeFontsScript,
  generateAdvancedFingerprintScript
} from './fingerprint/advanced/AdvancedFingerprintScripts.js';

// ML Pattern System
export { MLPatternAnalyzer } from './ml/MLPatternAnalyzer.js';
export { TimingPatternAnalyzer } from './ml/TimingPatternAnalyzer.js';
export { BehaviorPatternRecognizer } from './ml/BehaviorPatternRecognizer.js';
export { AnomalyDetector } from './ml/AnomalyDetector.js';
export { TrainingDataCollector } from './ml/TrainingDataCollector.js';

// Types
export type {
  AntiDetectionConfig,
  FingerprintConfig,
  BehaviorConfig,
  MouseMovementConfig,
  ScrollConfig,
  ReadingTimeConfig,
  HoverConfig,
  NetworkConfig,
  StealthConfig,
  TimingConfig,
  DetectionConfig,
  MLConfig,
  BrowserFingerprint,
  StealthReport,
  Viewport,
  ScreenResolution,
  Point,
  ProxyConfig,
  DetectionSignal,
  DetectionType,
  DetectionSeverity,
  IAntiDetectionManager,
  IFingerprintManager,
  IStealthManager,
  IBehaviorManager
} from './types.js';

// ML Types
export type {
  TimingObservation,
  TimingStats,
  TimingAnalyzerConfig
} from './ml/TimingPatternAnalyzer.js';

export type {
  BehaviorObservation,
  BehaviorAction,
  BehaviorPattern,
  BehaviorRecognizerConfig
} from './ml/BehaviorPatternRecognizer.js';

export type {
  MetricObservation,
  MetricStats,
  AnomalyResult,
  AnomalyDetectorConfig
} from './ml/AnomalyDetector.js';

export type {
  ScrapingSession,
  TrainingDataSnapshot,
  TrainingDataCollectorConfig
} from './ml/TrainingDataCollector.js';

export type {
  MLPatternAnalyzerConfig
} from './ml/MLPatternAnalyzer.js';
