/**
 * Behavior Pattern Recognizer
 *
 * Identifies patterns in browsing behavior and detects deviations from normal patterns.
 * Uses Markov chains and frequency analysis to model human-like behavior sequences.
 */

import { logger } from '../../../utils/logger.js';

/**
 * Behavior action types
 */
export type BehaviorAction =
  | 'navigate'
  | 'click'
  | 'scroll_up'
  | 'scroll_down'
  | 'hover'
  | 'type'
  | 'read'
  | 'back'
  | 'forward'
  | 'idle';

/**
 * Behavior sequence observation
 */
export interface BehaviorObservation {
  /** Sequence of actions */
  actions: BehaviorAction[];
  /** Whether the sequence was successful */
  successful: boolean;
  /** Duration of sequence (ms) */
  duration: number;
  /** Timestamp */
  timestamp: number;
  /** URL context */
  url?: string;
}

/**
 * Behavior pattern statistics
 */
export interface BehaviorPattern {
  /** Action sequence */
  sequence: BehaviorAction[];
  /** Frequency count */
  frequency: number;
  /** Success rate */
  successRate: number;
  /** Average duration */
  avgDuration: number;
}

/**
 * Transition probability in Markov chain
 */
interface TransitionProbability {
  /** From action */
  from: BehaviorAction;
  /** To action */
  to: BehaviorAction;
  /** Probability (0-1) */
  probability: number;
  /** Count of observations */
  count: number;
}

/**
 * Configuration for behavior recognition
 */
export interface BehaviorRecognizerConfig {
  /** Maximum observations to keep */
  maxObservations?: number;
  /** Minimum observations for pattern detection */
  minObservations?: number;
  /** Sequence length for pattern matching */
  sequenceLength?: number;
  /** Time window for observations (ms) */
  timeWindow?: number;
}

const DEFAULT_CONFIG: Required<BehaviorRecognizerConfig> = {
  maxObservations: 500,
  minObservations: 5,
  sequenceLength: 3,
  timeWindow: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Recognizes behavioral patterns using statistical analysis
 */
export class BehaviorPatternRecognizer {
  private config: Required<BehaviorRecognizerConfig>;
  private observations: BehaviorObservation[] = [];
  private currentSequence: BehaviorAction[] = [];
  private sequenceStartTime: number = Date.now();
  private transitionMatrix: Map<string, TransitionProbability> = new Map();

  constructor(config?: BehaviorRecognizerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    logger.debug('[ML:Behavior] BehaviorPatternRecognizer initialized', {
      maxObservations: this.config.maxObservations,
      sequenceLength: this.config.sequenceLength
    });
  }

  /**
   * Record a behavior action
   */
  recordAction(action: BehaviorAction): void {
    this.currentSequence.push(action);

    // Keep sequence at max length
    if (this.currentSequence.length > this.config.sequenceLength * 2) {
      this.currentSequence = this.currentSequence.slice(-this.config.sequenceLength);
    }

    logger.debug('[ML:Behavior] Action recorded', {
      action,
      sequenceLength: this.currentSequence.length
    });
  }

  /**
   * Complete current sequence and record observation
   */
  completeSequence(successful: boolean, url?: string): void {
    if (this.currentSequence.length === 0) {
      return;
    }

    const duration = Date.now() - this.sequenceStartTime;

    const observation: BehaviorObservation = {
      actions: [...this.currentSequence],
      successful,
      duration,
      timestamp: Date.now(),
      url
    };

    this.observations.push(observation);
    this.trimObservations();

    // Update transition matrix
    this.updateTransitionMatrix(this.currentSequence);

    logger.debug('[ML:Behavior] Sequence completed', {
      actions: this.currentSequence.join(' -> '),
      successful,
      duration,
      totalObservations: this.observations.length
    });

    // Reset sequence
    this.currentSequence = [];
    this.sequenceStartTime = Date.now();
  }

  /**
   * Get most common behavior patterns
   */
  getCommonPatterns(minFrequency: number = 2): BehaviorPattern[] {
    const patterns: Map<string, BehaviorPattern> = new Map();

    // Extract sequences of specified length
    for (const obs of this.observations) {
      for (let i = 0; i <= obs.actions.length - this.config.sequenceLength; i++) {
        const sequence = obs.actions.slice(i, i + this.config.sequenceLength);
        const key = sequence.join('->');

        const existing = patterns.get(key);
        if (existing) {
          existing.frequency++;
          existing.successRate =
            (existing.successRate * (existing.frequency - 1) + (obs.successful ? 1 : 0)) /
            existing.frequency;
          existing.avgDuration =
            (existing.avgDuration * (existing.frequency - 1) + obs.duration) / existing.frequency;
        } else {
          patterns.set(key, {
            sequence,
            frequency: 1,
            successRate: obs.successful ? 1 : 0,
            avgDuration: obs.duration
          });
        }
      }
    }

    // Filter by minimum frequency and sort by frequency
    return Array.from(patterns.values())
      .filter(p => p.frequency >= minFrequency)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Predict next action based on current sequence
   */
  predictNextAction(recentActions: BehaviorAction[]): BehaviorAction | null {
    if (recentActions.length === 0) {
      return null;
    }

    const lastAction = recentActions[recentActions.length - 1];

    // Find all transitions from last action
    const transitions: TransitionProbability[] = [];
    for (const [key, prob] of this.transitionMatrix.entries()) {
      const [from] = key.split('->');
      if (from === lastAction) {
        transitions.push(prob);
      }
    }

    if (transitions.length === 0) {
      return null;
    }

    // Sort by probability and return most likely
    transitions.sort((a, b) => b.probability - a.probability);

    const prediction = transitions[0];
    logger.debug('[ML:Behavior] Next action predicted', {
      from: lastAction,
      to: prediction.to,
      probability: (prediction.probability * 100).toFixed(1) + '%'
    });

    return prediction.to;
  }

  /**
   * Calculate similarity between two action sequences
   */
  calculateSimilarity(seq1: BehaviorAction[], seq2: BehaviorAction[]): number {
    // Use Levenshtein distance normalized by max length
    const distance = this.levenshteinDistance(seq1, seq2);
    const maxLen = Math.max(seq1.length, seq2.length);

    if (maxLen === 0) {
      return 1.0;
    }

    return 1 - distance / maxLen;
  }

  /**
   * Check if current sequence is anomalous
   */
  isAnomalous(sequence: BehaviorAction[], threshold: number = 0.7): boolean {
    if (this.observations.length < this.config.minObservations) {
      // Not enough data to determine
      return false;
    }

    const commonPatterns = this.getCommonPatterns(2);

    if (commonPatterns.length === 0) {
      // No patterns learned yet
      return false;
    }

    // Calculate max similarity to known patterns
    let maxSimilarity = 0;
    for (const pattern of commonPatterns) {
      const similarity = this.calculateSimilarity(sequence, pattern.sequence);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    const isAnomalous = maxSimilarity < threshold;

    logger.debug('[ML:Behavior] Anomaly check', {
      sequence: sequence.join(' -> '),
      maxSimilarity: (maxSimilarity * 100).toFixed(1) + '%',
      threshold: (threshold * 100).toFixed(1) + '%',
      isAnomalous
    });

    return isAnomalous;
  }

  /**
   * Get transition probabilities from an action
   */
  getTransitionProbabilities(from: BehaviorAction): TransitionProbability[] {
    const transitions: TransitionProbability[] = [];

    for (const [key, prob] of this.transitionMatrix.entries()) {
      const [fromAction] = key.split('->');
      if (fromAction === from) {
        transitions.push(prob);
      }
    }

    return transitions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Get all transition probabilities
   */
  getAllTransitions(): TransitionProbability[] {
    return Array.from(this.transitionMatrix.values());
  }

  /**
   * Generate a human-like behavior sequence
   */
  generateSequence(length: number, startAction?: BehaviorAction): BehaviorAction[] {
    const sequence: BehaviorAction[] = [];

    // Start with provided action or random common action
    let currentAction: BehaviorAction = startAction || this.getMostCommonAction();
    sequence.push(currentAction);

    // Generate sequence using Markov chain
    for (let i = 1; i < length; i++) {
      const nextAction = this.predictNextAction([currentAction]);

      if (!nextAction) {
        // No prediction available, use random common action
        currentAction = this.getMostCommonAction();
      } else {
        currentAction = nextAction;
      }

      sequence.push(currentAction);
    }

    logger.debug('[ML:Behavior] Sequence generated', {
      length,
      sequence: sequence.join(' -> ')
    });

    return sequence;
  }

  /**
   * Clear all observations
   */
  clearObservations(): void {
    this.observations = [];
    this.currentSequence = [];
    this.transitionMatrix.clear();
    logger.info('[ML:Behavior] All observations cleared');
  }

  /**
   * Export observations
   */
  exportObservations(): BehaviorObservation[] {
    return [...this.observations];
  }

  /**
   * Import observations
   */
  importObservations(observations: BehaviorObservation[]): void {
    this.observations = [...observations];
    this.trimObservations();
    this.rebuildTransitionMatrix();
    logger.info('[ML:Behavior] Observations imported', {
      count: this.observations.length
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Update transition matrix with a sequence
   */
  private updateTransitionMatrix(sequence: BehaviorAction[]): void {
    for (let i = 0; i < sequence.length - 1; i++) {
      const from = sequence[i];
      const to = sequence[i + 1];
      const key = `${from}->${to}`;

      const existing = this.transitionMatrix.get(key);
      if (existing) {
        existing.count++;
      } else {
        this.transitionMatrix.set(key, {
          from,
          to,
          probability: 0,
          count: 1
        });
      }
    }

    // Recalculate probabilities
    this.recalculateProbabilities();
  }

  /**
   * Recalculate transition probabilities
   */
  private recalculateProbabilities(): void {
    // Group by 'from' action
    const fromCounts: Map<BehaviorAction, number> = new Map();

    for (const prob of this.transitionMatrix.values()) {
      const count = fromCounts.get(prob.from) || 0;
      fromCounts.set(prob.from, count + prob.count);
    }

    // Calculate probabilities
    for (const prob of this.transitionMatrix.values()) {
      const totalCount = fromCounts.get(prob.from) || 1;
      prob.probability = prob.count / totalCount;
    }
  }

  /**
   * Rebuild transition matrix from observations
   */
  private rebuildTransitionMatrix(): void {
    this.transitionMatrix.clear();

    for (const obs of this.observations) {
      this.updateTransitionMatrix(obs.actions);
    }
  }

  /**
   * Get most common action
   */
  private getMostCommonAction(): BehaviorAction {
    const actionCounts: Map<BehaviorAction, number> = new Map();

    for (const obs of this.observations) {
      for (const action of obs.actions) {
        actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
      }
    }

    let maxAction: BehaviorAction = 'navigate';
    let maxCount = 0;

    for (const [action, count] of actionCounts.entries()) {
      if (count > maxCount) {
        maxAction = action;
        maxCount = count;
      }
    }

    return maxAction;
  }

  /**
   * Calculate Levenshtein distance between two sequences
   */
  private levenshteinDistance(seq1: BehaviorAction[], seq2: BehaviorAction[]): number {
    const m = seq1.length;
    const n = seq2.length;

    // Create distance matrix
    const dp: number[][] = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (seq1[i - 1] === seq2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Trim observations to max size
   */
  private trimObservations(): void {
    if (this.observations.length > this.config.maxObservations) {
      this.observations = this.observations.slice(-this.config.maxObservations);
      this.rebuildTransitionMatrix();
      logger.debug('[ML:Behavior] Observations trimmed', {
        newCount: this.observations.length
      });
    }

    // Remove observations outside time window
    const now = Date.now();
    const cutoff = now - this.config.timeWindow;
    const beforeCount = this.observations.length;

    this.observations = this.observations.filter(obs => obs.timestamp >= cutoff);

    if (this.observations.length < beforeCount) {
      this.rebuildTransitionMatrix();
      logger.debug('[ML:Behavior] Old observations removed', {
        removed: beforeCount - this.observations.length,
        remaining: this.observations.length
      });
    }
  }
}
