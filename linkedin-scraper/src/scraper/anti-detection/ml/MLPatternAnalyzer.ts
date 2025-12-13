/**
 * ML Pattern Analyzer
 *
 * Main orchestrator for all ML-based pattern analysis.
 * Coordinates timing patterns, behavior recognition, anomaly detection, and training data collection.
 */

import { logger } from '../../../utils/logger.js';
import {
  TimingPatternAnalyzer,
  type TimingAnalyzerConfig,
  type TimingObservation
} from './TimingPatternAnalyzer.js';
import {
  BehaviorPatternRecognizer,
  type BehaviorRecognizerConfig,
  type BehaviorAction
} from './BehaviorPatternRecognizer.js';
import {
  AnomalyDetector,
  type AnomalyDetectorConfig,
  type AnomalyResult
} from './AnomalyDetector.js';
import {
  TrainingDataCollector,
  type TrainingDataCollectorConfig
} from './TrainingDataCollector.js';

/**
 * ML Pattern Analyzer configuration
 */
export interface MLPatternAnalyzerConfig {
  /** Enable ML pattern analysis */
  enabled?: boolean;
  /** Timing analyzer config */
  timing?: TimingAnalyzerConfig;
  /** Behavior recognizer config */
  behavior?: BehaviorRecognizerConfig;
  /** Anomaly detector config */
  anomaly?: AnomalyDetectorConfig;
  /** Training data collector config */
  training?: TrainingDataCollectorConfig;
  /** Enable automatic learning from sessions */
  autoLearn?: boolean;
}

const DEFAULT_CONFIG: Required<Omit<MLPatternAnalyzerConfig, 'timing' | 'behavior' | 'anomaly' | 'training'>> & {
  timing: TimingAnalyzerConfig;
  behavior: BehaviorRecognizerConfig;
  anomaly: AnomalyDetectorConfig;
  training: TrainingDataCollectorConfig;
} = {
  enabled: true,
  autoLearn: true,
  timing: {},
  behavior: {},
  anomaly: {},
  training: {}
};

/**
 * Main ML pattern analyzer
 */
export class MLPatternAnalyzer {
  private config: typeof DEFAULT_CONFIG;
  private timingAnalyzer: TimingPatternAnalyzer;
  private behaviorRecognizer: BehaviorPatternRecognizer;
  private anomalyDetector: AnomalyDetector;
  private trainingCollector: TrainingDataCollector;
  private initialized: boolean = false;

  constructor(config?: MLPatternAnalyzerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.timingAnalyzer = new TimingPatternAnalyzer(this.config.timing);
    this.behaviorRecognizer = new BehaviorPatternRecognizer(this.config.behavior);
    this.anomalyDetector = new AnomalyDetector(this.config.anomaly);
    this.trainingCollector = new TrainingDataCollector(this.config.training);

    logger.info('[ML] MLPatternAnalyzer created', {
      enabled: this.config.enabled,
      autoLearn: this.config.autoLearn
    });
  }

  /**
   * Initialize - load training data and setup models
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('[ML] ML Pattern Analysis disabled');
      return;
    }

    // Initialize training data collector
    await this.trainingCollector.initialize();

    // Load historical data into analyzers
    if (this.config.autoLearn) {
      await this.loadTrainingData();
    }

    this.initialized = true;

    logger.info('[ML] MLPatternAnalyzer initialized', {
      timingStats: this.timingAnalyzer.getAllStats().length,
      behaviorPatterns: this.behaviorRecognizer.getCommonPatterns().length,
      anomalyMetrics: this.anomalyDetector.getTrackedMetrics().length,
      sessions: this.trainingCollector.getSessions().length
    });
  }

  /**
   * Start a new scraping session
   */
  startSession(sessionId: string): void {
    if (!this.config.enabled) return;

    this.trainingCollector.startSession(sessionId);
    logger.debug('[ML] Scraping session started', { sessionId });
  }

  /**
   * End current scraping session
   */
  async endSession(successful: boolean): Promise<void> {
    if (!this.config.enabled) return;

    this.trainingCollector.endSession(successful);

    // Save training data
    await this.trainingCollector.saveData();

    logger.debug('[ML] Scraping session ended', { successful });
  }

  /**
   * Record a timing observation and update predictions
   */
  recordTiming(observation: TimingObservation): void {
    if (!this.config.enabled) return;

    // Record in timing analyzer
    this.timingAnalyzer.recordObservation(observation);

    // Record in training collector
    this.trainingCollector.addTimingObservation(observation);

    // Update session stats
    this.trainingCollector.recordSessionEvent({
      pagesScraped: 1,
      successfulScrapes: observation.successful ? 1 : 0,
      failedScrapes: observation.successful ? 0 : 1
    });
  }

  /**
   * Record a behavior action
   */
  recordBehaviorAction(action: BehaviorAction): void {
    if (!this.config.enabled) return;

    this.behaviorRecognizer.recordAction(action);
  }

  /**
   * Complete behavior sequence
   */
  completeBehaviorSequence(successful: boolean, url?: string): void {
    if (!this.config.enabled) return;

    this.behaviorRecognizer.completeSequence(successful, url);

    // Get the completed observation (last one)
    const observations = this.behaviorRecognizer.exportObservations();
    if (observations.length > 0) {
      const lastObs = observations[observations.length - 1];
      this.trainingCollector.addBehaviorObservation(lastObs);
    }

    // Update session
    this.trainingCollector.recordSessionEvent({
      urls: url ? [url] : []
    });
  }

  /**
   * Record and check metrics for anomalies
   */
  checkMetrics(metrics: Record<string, number>): Map<string, AnomalyResult> {
    if (!this.config.enabled) {
      return new Map();
    }

    // Record all metrics
    for (const [metric, value] of Object.entries(metrics)) {
      this.anomalyDetector.recordMetric(metric, value);

      // Also add to training collector
      this.trainingCollector.addMetricObservation({
        metric,
        value,
        timestamp: Date.now()
      });
    }

    // Detect anomalies
    const anomalies = this.anomalyDetector.checkMetrics(metrics);

    // Update session if anomalies detected
    if (anomalies.size > 0) {
      this.trainingCollector.recordSessionEvent({
        detectionEvents: anomalies.size
      });
    }

    return anomalies;
  }

  /**
   * Predict optimal delay for an action
   */
  predictDelay(actionType: TimingObservation['actionType'], baseDelay: number = 1000): number {
    if (!this.config.enabled) {
      return baseDelay;
    }

    return this.timingAnalyzer.predictDelay(actionType, baseDelay);
  }

  /**
   * Adjust delay based on feedback
   */
  adjustDelay(
    actionType: TimingObservation['actionType'],
    currentDelay: number,
    successful: boolean
  ): number {
    if (!this.config.enabled) {
      return currentDelay;
    }

    return this.timingAnalyzer.adjustDelay(actionType, currentDelay, successful);
  }

  /**
   * Predict next behavior action
   */
  predictNextAction(recentActions: BehaviorAction[]): BehaviorAction | null {
    if (!this.config.enabled) {
      return null;
    }

    return this.behaviorRecognizer.predictNextAction(recentActions);
  }

  /**
   * Generate human-like behavior sequence
   */
  generateBehaviorSequence(length: number, startAction?: BehaviorAction): BehaviorAction[] {
    if (!this.config.enabled) {
      return [];
    }

    return this.behaviorRecognizer.generateSequence(length, startAction);
  }

  /**
   * Check if behavior sequence is anomalous
   */
  isBehaviorAnomalous(sequence: BehaviorAction[], threshold: number = 0.7): boolean {
    if (!this.config.enabled) {
      return false;
    }

    return this.behaviorRecognizer.isAnomalous(sequence, threshold);
  }

  /**
   * Get timing statistics for all action types
   */
  getTimingStats() {
    return this.timingAnalyzer.getAllStats();
  }

  /**
   * Get common behavior patterns
   */
  getBehaviorPatterns(minFrequency: number = 2) {
    return this.behaviorRecognizer.getCommonPatterns(minFrequency);
  }

  /**
   * Get anomaly statistics for all metrics
   */
  getAnomalyStats() {
    return this.anomalyDetector.getAllStats();
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    return this.trainingCollector.getSessionStats();
  }

  /**
   * Get timing analyzer
   */
  getTimingAnalyzer(): TimingPatternAnalyzer {
    return this.timingAnalyzer;
  }

  /**
   * Get behavior recognizer
   */
  getBehaviorRecognizer(): BehaviorPatternRecognizer {
    return this.behaviorRecognizer;
  }

  /**
   * Get anomaly detector
   */
  getAnomalyDetector(): AnomalyDetector {
    return this.anomalyDetector;
  }

  /**
   * Get training data collector
   */
  getTrainingCollector(): TrainingDataCollector {
    return this.trainingCollector;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Enable ML pattern analysis
   */
  enable(): void {
    this.config.enabled = true;
    logger.info('[ML] ML Pattern Analysis enabled');
  }

  /**
   * Disable ML pattern analysis
   */
  disable(): void {
    this.config.enabled = false;
    logger.info('[ML] ML Pattern Analysis disabled');
  }

  /**
   * Shutdown - save all data
   */
  async shutdown(): Promise<void> {
    if (!this.config.enabled) return;

    await this.trainingCollector.shutdown();
    logger.info('[ML] MLPatternAnalyzer shutdown complete');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Load training data into analyzers
   */
  private async loadTrainingData(): Promise<void> {
    try {
      const timingObs = this.trainingCollector.getTimingObservations();
      const behaviorObs = this.trainingCollector.getBehaviorObservations();
      const metricObs = this.trainingCollector.getMetricObservations();

      // Load timing observations
      if (timingObs.length > 0) {
        this.timingAnalyzer.importObservations(timingObs);
        logger.debug('[ML] Timing observations loaded', { count: timingObs.length });
      }

      // Load behavior observations
      if (behaviorObs.length > 0) {
        this.behaviorRecognizer.importObservations(behaviorObs);
        logger.debug('[ML] Behavior observations loaded', { count: behaviorObs.length });
      }

      // Load metric observations
      if (Object.keys(metricObs).length > 0) {
        this.anomalyDetector.importObservations(metricObs);
        logger.debug('[ML] Metric observations loaded', {
          metrics: Object.keys(metricObs).length
        });
      }

      logger.info('[ML] Training data loaded successfully');
    } catch (error) {
      logger.error('[ML] Failed to load training data', { error });
    }
  }
}
