/**
 * Behavior Manager
 *
 * Simulates human-like browsing behaviors to avoid detection:
 * - Mouse movement with Bezier curves
 * - Random scrolling patterns
 * - Reading time based on content length
 * - Hover behaviors before clicks
 */

import type { Page } from 'playwright';
import type {
  BehaviorConfig,
  Point,
  MouseMovementConfig,
  ScrollConfig,
  ReadingTimeConfig,
  HoverConfig,
  IBehaviorManager
} from '../types.js';
import { logger } from '../../../utils/logger.js';

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_MOUSE_CONFIG: MouseMovementConfig = {
  enabled: true,
  curviness: 0.3,
  steps: 20,
  durationMin: 200,
  durationMax: 500
};

const DEFAULT_SCROLL_CONFIG: ScrollConfig = {
  enabled: true,
  randomScrolls: true,
  scrollBeforeAction: true,
  minScrolls: 1,
  maxScrolls: 3,
  scrollDistanceMin: 100,
  scrollDistanceMax: 500,
  scrollDurationMin: 300,
  scrollDurationMax: 800
};

const DEFAULT_READING_CONFIG: ReadingTimeConfig = {
  enabled: true,
  baseWPM: 200,        // Average reading speed
  variability: 0.3,    // 30% variability
  minReadingTime: 2000,
  maxReadingTime: 15000
};

const DEFAULT_HOVER_CONFIG: HoverConfig = {
  enabled: true,
  hoverBeforeClick: true,
  hoverDurationMin: 100,
  hoverDurationMax: 300,
  hoverProbability: 0.7  // 70% chance of hovering
};

// ============================================================================
// BehaviorManager Implementation
// ============================================================================

export class BehaviorManager implements IBehaviorManager {
  private config: BehaviorConfig;
  private mouseConfig: MouseMovementConfig;
  private scrollConfig: ScrollConfig;
  private readingConfig: ReadingTimeConfig;
  private hoverConfig: HoverConfig;

  constructor(config?: Partial<BehaviorConfig>) {
    this.config = {
      enableMouseMovement: config?.enableMouseMovement ?? true,
      enableScrollSimulation: config?.enableScrollSimulation ?? true,
      enableReadingTime: config?.enableReadingTime ?? true,
      enableTypingSimulation: config?.enableTypingSimulation ?? false,
      humanLikeDelays: config?.humanLikeDelays ?? true,
      ...config
    };

    this.mouseConfig = { ...DEFAULT_MOUSE_CONFIG, ...config?.mouseMovement };
    this.scrollConfig = { ...DEFAULT_SCROLL_CONFIG, ...config?.scroll };
    this.readingConfig = { ...DEFAULT_READING_CONFIG, ...config?.readingTime };
    this.hoverConfig = { ...DEFAULT_HOVER_CONFIG, ...config?.hover };
  }

  // ============================================================================
  // Hook Methods (called by AntiDetectionManager)
  // ============================================================================

  async beforeNavigate(_page: Page, url: string): Promise<void> {
    logger.debug('[Behavior] Before navigate', { url });
  }

  async afterNavigate(page: Page, _url: string): Promise<void> {
    if (!this.config.enableScrollSimulation || !this.scrollConfig.randomScrolls) {
      return;
    }

    // Simulate random scrolling after page load
    logger.debug('[Behavior] Simulating post-navigation scrolling');
    const scrollCount = this.randomInt(this.scrollConfig.minScrolls, this.scrollConfig.maxScrolls);

    for (let i = 0; i < scrollCount; i++) {
      await this.simulateScrolling(page);
      await this.randomDelay(500, 1500);
    }
  }

  async beforeClick(page: Page, selector: string): Promise<void> {
    // Hover before clicking (if enabled and probability check passes)
    if (this.config.enableMouseMovement && this.hoverConfig.enabled &&
        this.hoverConfig.hoverBeforeClick && Math.random() < this.hoverConfig.hoverProbability) {
      await this.simulateHover(page, selector);
    }

    // Scroll element into view (if enabled)
    if (this.config.enableScrollSimulation && this.scrollConfig.scrollBeforeAction) {
      logger.debug('[Behavior] Scrolling element into view', { selector });
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, selector);
      await this.randomDelay(300, 700);
    }
  }

  async afterClick(_page: Page): Promise<void> {
    // Small delay after clicking
    if (this.config.humanLikeDelays) {
      await this.randomDelay(200, 500);
    }
  }

  // ============================================================================
  // Mouse Movement Simulation
  // ============================================================================

  async simulateMouseMovement(page: Page, from: Point, to: Point): Promise<void> {
    if (!this.config.enableMouseMovement || !this.mouseConfig.enabled) {
      return;
    }

    logger.debug('[Behavior] Simulating mouse movement', { from, to });

    // Generate Bezier curve path
    const path = this.generateBezierPath(from, to, this.mouseConfig.curviness, this.mouseConfig.steps);

    // Calculate movement duration
    const duration = this.randomInt(this.mouseConfig.durationMin, this.mouseConfig.durationMax);
    const stepDelay = duration / path.length;

    // Move mouse along path
    for (const point of path) {
      await page.mouse.move(point.x, point.y);
      await this.delay(stepDelay);
    }
  }

  /**
   * Generate a smooth Bezier curve path from point A to point B
   */
  private generateBezierPath(from: Point, to: Point, curviness: number, steps: number): Point[] {
    const path: Point[] = [];

    // Calculate control points for cubic Bezier curve
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Add randomness to control points based on curviness
    const cp1x = from.x + dx * 0.25 + (Math.random() - 0.5) * Math.abs(dx) * curviness;
    const cp1y = from.y + dy * 0.25 + (Math.random() - 0.5) * Math.abs(dy) * curviness;
    const cp2x = from.x + dx * 0.75 + (Math.random() - 0.5) * Math.abs(dx) * curviness;
    const cp2y = from.y + dy * 0.75 + (Math.random() - 0.5) * Math.abs(dy) * curviness;

    // Generate points along Bezier curve
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this.cubicBezier(
        from,
        { x: cp1x, y: cp1y },
        { x: cp2x, y: cp2y },
        to,
        t
      );
      path.push(point);
    }

    return path;
  }

  /**
   * Calculate point on cubic Bezier curve at t (0-1)
   */
  private cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

    return { x, y };
  }

  // ============================================================================
  // Scrolling Simulation
  // ============================================================================

  async simulateScrolling(page: Page, distance?: number): Promise<void> {
    if (!this.config.enableScrollSimulation || !this.scrollConfig.enabled) {
      return;
    }

    const scrollDistance = distance ?? this.randomInt(
      this.scrollConfig.scrollDistanceMin,
      this.scrollConfig.scrollDistanceMax
    );

    const scrollDuration = this.randomInt(
      this.scrollConfig.scrollDurationMin,
      this.scrollConfig.scrollDurationMax
    );

    logger.debug('[Behavior] Simulating scroll', { distance: scrollDistance, duration: scrollDuration });

    // Smooth scroll using wheel events
    const steps = 10;
    const stepDistance = scrollDistance / steps;
    const stepDelay = scrollDuration / steps;

    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, stepDistance);
      await this.delay(stepDelay);
    }
  }

  // ============================================================================
  // Reading Time Simulation
  // ============================================================================

  async simulateReadingTime(page: Page, contentLength?: number): Promise<void> {
    if (!this.config.enableReadingTime || !this.readingConfig.enabled) {
      return;
    }

    let readingTime: number;

    if (contentLength) {
      // Calculate based on content length
      const words = Math.max(contentLength / 5, 10); // Rough estimate: 5 chars per word
      const baseTime = (words / this.readingConfig.baseWPM) * 60 * 1000; // Convert to ms

      // Add variability
      const variability = this.readingConfig.variability;
      const variation = baseTime * variability * (Math.random() - 0.5) * 2;
      readingTime = baseTime + variation;
    } else {
      // Use random reading time within bounds
      readingTime = this.randomInt(
        this.readingConfig.minReadingTime,
        this.readingConfig.maxReadingTime
      );
    }

    // Clamp to min/max bounds
    readingTime = Math.max(
      this.readingConfig.minReadingTime,
      Math.min(this.readingConfig.maxReadingTime, readingTime)
    );

    logger.debug('[Behavior] Simulating reading time', {
      duration: readingTime,
      contentLength
    });

    // During reading time, occasionally scroll
    if (this.config.enableScrollSimulation && this.scrollConfig.randomScrolls) {
      const scrollCount = Math.floor(readingTime / 3000); // One scroll every ~3 seconds
      const scrollInterval = readingTime / (scrollCount + 1);

      for (let i = 0; i < scrollCount; i++) {
        await this.delay(scrollInterval);
        await this.simulateScrolling(page);
      }

      // Wait remaining time
      await this.delay(readingTime % scrollInterval);
    } else {
      await this.delay(readingTime);
    }
  }

  // ============================================================================
  // Hover Simulation
  // ============================================================================

  async simulateHover(page: Page, selector: string): Promise<void> {
    if (!this.config.enableMouseMovement || !this.hoverConfig.enabled) {
      return;
    }

    try {
      logger.debug('[Behavior] Simulating hover', { selector });

      // Get element position
      const box = await page.locator(selector).boundingBox();
      if (!box) {
        logger.warn('[Behavior] Cannot hover - element not visible', { selector });
        return;
      }

      // Get current mouse position (approximate)
      const currentPos = { x: box.x - 100, y: box.y - 100 };

      // Calculate hover target (random point within element)
      const targetPos = {
        x: box.x + box.width * (0.3 + Math.random() * 0.4),
        y: box.y + box.height * (0.3 + Math.random() * 0.4)
      };

      // Move mouse to element
      await this.simulateMouseMovement(page, currentPos, targetPos);

      // Hover for random duration
      const hoverDuration = this.randomInt(
        this.hoverConfig.hoverDurationMin,
        this.hoverConfig.hoverDurationMax
      );
      await this.delay(hoverDuration);
    } catch (error) {
      logger.warn('[Behavior] Hover simulation failed', { selector, error });
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomDelay(min: number, max: number): Promise<void> {
    const delay = this.randomInt(min, max);
    return this.delay(delay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
