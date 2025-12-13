/**
 * Timing Pattern Analyzer
 *
 * Uses statistical analysis to learn optimal timing patterns and predict delays.
 * Analyzes historical scraping data to identify successful timing strategies.
 */

import { logger } from '../../../utils/logger.js';

/**
 * Timing observation record
 */
export interface TimingObservation {
  /** Type of action */
  actionType: 'navigation' | 'click' | 'scroll' | 'typing' | 'hover';
  /** Delay used (ms) */
  delay: number;
  /** Whether the action was successful (no detection) */
  successful: boolean;
  /** Timestamp of observation */
  timestamp: number;
  /** URL context */
  url?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Timing statistics for an action type
 */
export interface TimingStats {
  /** Action type */
  actionType: string;
  /** Mean delay */
  mean: number;
  /** Standard deviation */
  stdDev: number;
  /** Median delay */
  median: number;
  /** Minimum delay observed */
  min: number;
  /** Maximum delay observed */
  max: number;
  /** Success rate */
  successRate: number;
  /** Total observations */
  count: number;
  /** Recommended delay (mean + 0.5 * stdDev) */
  recommended: number;
}

/**
 * Configuration for timing analysis
 */
export interface TimingAnalyzerConfig {
  /** Maximum observations to keep in memory */
  maxObservations?: number;
  /** Minimum observations before making predictions */
  minObservations?: number;
  /** Weight for recent observations (0-1) */
  recencyWeight?: number;
  /** Time window for observations (ms) */
  timeWindow?: number;
  /** Enable adaptive learning */
  enableAdaptiveLearning?: boolean;
}

const DEFAULT_CONFIG: Required<TimingAnalyzerConfig> = {
  maxObservations: 1000,
  minObservations: 10,
  recencyWeight: 0.7,
  timeWindow: 24 * 60 * 60 * 1000, // 24 hours
  enableAdaptiveLearning: true
};

/**
 * Analyzes timing patterns to predict optimal delays
 */
export class TimingPatternAnalyzer {
  private config: Required<TimingAnalyzerConfig>;
  private observations: TimingObservation[] = [];
  private predictionCache: Map<string, { delay: number; timestamp: number }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor(config?: TimingAnalyzerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.debug('[ML:Timing] TimingPatternAnalyzer initialized', {
      maxObservations: this.config.maxObservations,
      minObservations: this.config.minObservations,
      adaptiveLearning: this.config.enableAdaptiveLearning
    });
  }

  /**
   * Record a timing observation
   */
  recordObservation(observation: TimingObservation): void {
    // Add timestamp if not provided
    if (!observation.timestamp) {
      observation.timestamp = Date.now();
    }

    this.observations.push(observation);

    // Trim old observations
    this.trimObservations();

    // Invalidate cache for this action type
    this.predictionCache.delete(observation.actionType);

    logger.debug('[ML:Timing] Observation recorded', {
      actionType: observation.actionType,
      delay: observation.delay,
      successful: observation.successful,
      totalObservations: this.observations.length
    });
  }

  /**
   * Predict optimal delay for an action type
   */
  predictDelay(actionType: TimingObservation['actionType'], baseDelay: number = 1000): number {
    // Check cache
    const cached = this.predictionCache.get(actionType);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      logger.debug('[ML:Timing] Using cached prediction', {
        actionType,
        delay: cached.delay
      });
      return cached.delay;
    }

    // Get relevant observations
    const relevantObs = this.getRelevantObservations(actionType);

    // Not enough data, use base delay
    if (relevantObs.length < this.config.minObservations) {
      logger.debug('[ML:Timing] Insufficient data, using base delay', {
        actionType,
        observations: relevantObs.length,
        minRequired: this.config.minObservations,
        baseDelay
      });
      return baseDelay;
    }

    // Calculate statistics
    const stats = this.calculateStats(relevantObs);

    // Use recommended delay (mean + 0.5 * stdDev for safety margin)
    const predictedDelay = stats.recommended;

    // Cache prediction
    this.predictionCache.set(actionType, {
      delay: predictedDelay,
      timestamp: Date.now()
    });

    logger.debug('[ML:Timing] Delay predicted', {
      actionType,
      predictedDelay: Math.round(predictedDelay),
      baseDelay,
      stats: {
        mean: Math.round(stats.mean),
        stdDev: Math.round(stats.stdDev),
        median: Math.round(stats.median),
        successRate: (stats.successRate * 100).toFixed(1) + '%',
        observations: stats.count
      }
    });

    return predictedDelay;
  }

  /**
   * Get timing statistics for an action type
   */
  getStats(actionType: TimingObservation['actionType']): TimingStats | null {
    const relevantObs = this.getRelevantObservations(actionType);

    if (relevantObs.length === 0) {
      return null;
    }

    return this.calculateStats(relevantObs);
  }

  /**
   * Get all timing statistics
   */
  getAllStats(): TimingStats[] {
    const actionTypes: TimingObservation['actionType'][] = [
      'navigation',
      'click',
      'scroll',
      'typing',
      'hover'
    ];

    return actionTypes
      .map(type => this.getStats(type))
      .filter((stats): stats is TimingStats => stats !== null);
  }

  /**
   * Adjust delay based on success/failure feedback
   */
  adjustDelay(
    actionType: TimingObservation['actionType'],
    currentDelay: number,
    successful: boolean
  ): number {
    if (!this.config.enableAdaptiveLearning) {
      return currentDelay;
    }

    // Record the observation
    this.recordObservation({
      actionType,
      delay: currentDelay,
      successful,
      timestamp: Date.now()
    });

    // Calculate adjustment
    let adjustedDelay = currentDelay;

    if (!successful) {
      // Increase delay by 20-30% on failure
      const increase = currentDelay * (0.2 + Math.random() * 0.1);
      adjustedDelay = currentDelay + increase;
    } else {
      // Gradually decrease delay by 5-10% on success
      const decrease = currentDelay * (0.05 + Math.random() * 0.05);
      adjustedDelay = Math.max(500, currentDelay - decrease); // Minimum 500ms
    }

    logger.debug('[ML:Timing] Delay adjusted', {
      actionType,
      currentDelay: Math.round(currentDelay),
      adjustedDelay: Math.round(adjustedDelay),
      successful,
      change: Math.round(adjustedDelay - currentDelay)
    });

    return adjustedDelay;
  }

  /**
   * Get optimal delay range for an action type
   */
  getDelayRange(actionType: TimingObservation['actionType']): { min: number; max: number; optimal: number } {
    const stats = this.getStats(actionType);

    if (!stats) {
      // Default ranges
      const defaults = {
        navigation: { min: 1500, max: 3000, optimal: 2000 },
        click: { min: 500, max: 1500, optimal: 1000 },
        scroll: { min: 800, max: 2000, optimal: 1200 },
        typing: { min: 50, max: 200, optimal: 100 },
        hover: { min: 300, max: 1000, optimal: 500 }
      };
      return defaults[actionType];
    }

    // Calculate range from statistics
    // Use mean ± 1 stdDev for range, recommended as optimal
    return {
      min: Math.max(100, stats.mean - stats.stdDev),
      max: stats.mean + stats.stdDev * 1.5,
      optimal: stats.recommended
    };
  }

  /**
   * Clear all observations
   */
  clearObservations(): void {
    this.observations = [];
    this.predictionCache.clear();
    logger.info('[ML:Timing] All observations cleared');
  }

  /**
   * Export observations for analysis
   */
  exportObservations(): TimingObservation[] {
    return [...this.observations];
  }

  /**
   * Import observations (for loading saved data)
   */
  importObservations(observations: TimingObservation[]): void {
    this.observations = [...observations];
    this.trimObservations();
    this.predictionCache.clear();
    logger.info('[ML:Timing] Observations imported', {
      count: this.observations.length
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get relevant observations for an action type
   */
  private getRelevantObservations(actionType: TimingObservation['actionType']): TimingObservation[] {
    const now = Date.now();
    const cutoff = now - this.config.timeWindow;

    return this.observations.filter(
      obs => obs.actionType === actionType && obs.timestamp >= cutoff
    );
  }

  /**
   * Calculate statistics from observations
   */
  private calculateStats(observations: TimingObservation[]): TimingStats {
    const delays = observations.map(obs => obs.delay);
    const successful = observations.filter(obs => obs.successful);

    // Calculate mean
    const mean = delays.reduce((sum, d) => sum + d, 0) / delays.length;

    // Calculate standard deviation
    const variance = delays.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / delays.length;
    const stdDev = Math.sqrt(variance);

    // Calculate median
    const sorted = [...delays].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Success rate
    const successRate = successful.length / observations.length;

    // Recommended delay (mean + 0.5 * stdDev for safety)
    const recommended = mean + 0.5 * stdDev;

    return {
      actionType: observations[0]?.actionType || 'unknown',
      mean,
      stdDev,
      median,
      min: Math.min(...delays),
      max: Math.max(...delays),
      successRate,
      count: observations.length,
      recommended
    };
  }

  /**
   * Trim observations to max size
   */
  private trimObservations(): void {
    if (this.observations.length > this.config.maxObservations) {
      // Keep most recent observations
      this.observations = this.observations.slice(-this.config.maxObservations);
      logger.debug('[ML:Timing] Observations trimmed', {
        newCount: this.observations.length
      });
    }

    // Also remove observations outside time window
    const now = Date.now();
    const cutoff = now - this.config.timeWindow;
    const beforeCount = this.observations.length;

    this.observations = this.observations.filter(obs => obs.timestamp >= cutoff);

    if (this.observations.length < beforeCount) {
      logger.debug('[ML:Timing] Old observations removed', {
        removed: beforeCount - this.observations.length,
        remaining: this.observations.length
      });
    }
  }
}
