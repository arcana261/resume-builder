/**
 * Advanced Fingerprint Scripts
 *
 * JavaScript injection scripts for randomizing advanced browser fingerprints:
 * - Canvas fingerprinting
 * - WebGL fingerprinting
 * - Audio context fingerprinting
 * - Font fingerprinting
 */

// ============================================================================
// Canvas Fingerprinting Randomization
// ============================================================================

/**
 * Randomize canvas fingerprint by adding noise to canvas operations
 *
 * Canvas fingerprinting works by drawing text/shapes and reading pixel data.
 * This script adds subtle noise to the pixel data to make each instance unique.
 */
export function randomizeCanvasScript(noiseLevel: number = 0.001): string {
  return `
    (function() {
      // Store original methods
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;

      // Noise level: ${noiseLevel}
      const noiseLevel = ${noiseLevel};

      // Add noise to image data
      function addNoise(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Add random noise to RGB channels (not alpha)
          const noise = Math.floor((Math.random() - 0.5) * 2 * noiseLevel * 255);
          data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        return imageData;
      }

      // Override getImageData
      CanvasRenderingContext2D.prototype.getImageData = function(...args) {
        const imageData = originalGetImageData.apply(this, args);
        return addNoise(imageData);
      };

      // Override toDataURL
      HTMLCanvasElement.prototype.toDataURL = function(...args) {
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, this.width, this.height);
          addNoise(imageData);
          context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, args);
      };

      // Override toBlob
      HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
        const context = this.getContext('2d');
        if (context) {
          const imageData = context.getImageData(0, 0, this.width, this.height);
          addNoise(imageData);
          context.putImageData(imageData, 0, 0);
        }
        return originalToBlob.call(this, callback, ...args);
      };

      console.log('[AdvancedFingerprint] Canvas randomization applied');
    })();
  `;
}

// ============================================================================
// WebGL Fingerprinting Randomization
// ============================================================================

/**
 * Randomize WebGL fingerprint by modifying renderer info and parameters
 *
 * WebGL fingerprinting reads GPU vendor, renderer, and extension info.
 * This script randomizes these values and adds noise to rendering.
 */
export function randomizeWebGLScript(): string {
  return `
    (function() {
      // Random vendor and renderer from common GPUs
      const vendors = [
        'Intel Inc.',
        'NVIDIA Corporation',
        'AMD',
        'Apple Inc.',
        'Qualcomm'
      ];

      const renderers = [
        'Intel(R) UHD Graphics 630',
        'Intel(R) Iris(TM) Plus Graphics 640',
        'NVIDIA GeForce GTX 1060',
        'NVIDIA GeForce RTX 3060',
        'AMD Radeon RX 580 Series',
        'AMD Radeon Pro 560',
        'Apple M1',
        'Apple M2',
        'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)'
      ];

      const randomVendor = vendors[Math.floor(Math.random() * vendors.length)];
      const randomRenderer = renderers[Math.floor(Math.random() * renderers.length)];

      // Override WebGL getParameter
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return randomVendor;
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return randomRenderer;
        }
        return getParameter.call(this, parameter);
      };

      // Also override for WebGL2
      if (window.WebGL2RenderingContext) {
        const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(parameter) {
          if (parameter === 37445) {
            return randomVendor;
          }
          if (parameter === 37446) {
            return randomRenderer;
          }
          return getParameter2.call(this, parameter);
        };
      }

      // Override getExtension to control which extensions are reported
      const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
      WebGLRenderingContext.prototype.getExtension = function(name) {
        // Allow most extensions but randomize some
        if (name === 'WEBGL_debug_renderer_info') {
          return originalGetExtension.call(this, name);
        }
        return originalGetExtension.call(this, name);
      };

      console.log('[AdvancedFingerprint] WebGL randomization applied', {
        vendor: randomVendor,
        renderer: randomRenderer
      });
    })();
  `;
}

// ============================================================================
// Audio Context Fingerprinting Randomization
// ============================================================================

/**
 * Randomize audio context fingerprint by adding noise to audio processing
 *
 * Audio fingerprinting analyzes how the system processes audio signals.
 * This script adds subtle noise to make each instance unique.
 */
export function randomizeAudioScript(noiseLevel: number = 0.0001): string {
  return `
    (function() {
      const noiseLevel = ${noiseLevel};

      // Override AudioBuffer.getChannelData
      if (window.AudioBuffer) {
        const originalGetChannelData = AudioBuffer.prototype.getChannelData;
        AudioBuffer.prototype.getChannelData = function(channel) {
          const data = originalGetChannelData.call(this, channel);

          // Add noise to first few samples (fingerprinting typically checks these)
          for (let i = 0; i < Math.min(100, data.length); i++) {
            const noise = (Math.random() - 0.5) * 2 * noiseLevel;
            data[i] = data[i] + noise;
          }

          return data;
        };
      }

      // Override AnalyserNode.getFloatFrequencyData
      if (window.AnalyserNode) {
        const originalGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
        AnalyserNode.prototype.getFloatFrequencyData = function(array) {
          originalGetFloatFrequencyData.call(this, array);

          // Add subtle noise
          for (let i = 0; i < array.length; i++) {
            const noise = (Math.random() - 0.5) * 2 * noiseLevel * 10;
            array[i] = array[i] + noise;
          }

          return array;
        };
      }

      // Override DynamicsCompressorNode to randomize reduction values
      if (window.DynamicsCompressorNode) {
        Object.defineProperty(DynamicsCompressorNode.prototype, 'reduction', {
          get: function() {
            const baseReduction = -30 + Math.random() * 10; // Random reduction between -30 and -20
            return baseReduction;
          }
        });
      }

      console.log('[AdvancedFingerprint] Audio randomization applied');
    })();
  `;
}

// ============================================================================
// Font Fingerprinting Randomization
// ============================================================================

/**
 * Randomize font fingerprint by modifying font measurement
 *
 * Font fingerprinting measures text rendering with different fonts.
 * This script adds subtle variations to font measurements.
 */
export function randomizeFontsScript(): string {
  return `
    (function() {
      // Store original methods
      const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;

      // Add small random offset to text measurements
      CanvasRenderingContext2D.prototype.measureText = function(text) {
        const metrics = originalMeasureText.call(this, text);

        // Add small random variation to width (±0.1px)
        const randomOffset = (Math.random() - 0.5) * 0.2;

        // Create new metrics object with modified width
        const modifiedMetrics = {
          width: metrics.width + randomOffset,
          actualBoundingBoxLeft: metrics.actualBoundingBoxLeft,
          actualBoundingBoxRight: metrics.actualBoundingBoxRight,
          fontBoundingBoxAscent: metrics.fontBoundingBoxAscent,
          fontBoundingBoxDescent: metrics.fontBoundingBoxDescent,
          actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
          actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
          emHeightAscent: metrics.emHeightAscent,
          emHeightDescent: metrics.emHeightDescent,
          hangingBaseline: metrics.hangingBaseline,
          alphabeticBaseline: metrics.alphabeticBaseline,
          ideographicBaseline: metrics.ideographicBaseline
        };

        return modifiedMetrics;
      };

      // Randomize offsetWidth and offsetHeight for font detection elements
      const originalOffsetWidthGetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth').get;
      const originalOffsetHeightGetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight').get;

      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        get: function() {
          const originalWidth = originalOffsetWidthGetter.call(this);
          // Only add noise for very specific elements (likely font detection)
          if (this.style && this.style.position === 'absolute' && this.style.visibility === 'hidden') {
            return originalWidth + (Math.random() - 0.5) * 0.1;
          }
          return originalWidth;
        }
      });

      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        get: function() {
          const originalHeight = originalOffsetHeightGetter.call(this);
          // Only add noise for very specific elements (likely font detection)
          if (this.style && this.style.position === 'absolute' && this.style.visibility === 'hidden') {
            return originalHeight + (Math.random() - 0.5) * 0.1;
          }
          return originalHeight;
        }
      });

      console.log('[AdvancedFingerprint] Font randomization applied');
    })();
  `;
}

// ============================================================================
// Combined Script Generator
// ============================================================================

/**
 * Generate combined advanced fingerprint script based on configuration
 */
export function generateAdvancedFingerprintScript(config: {
  randomizeCanvas: boolean;
  randomizeWebGL: boolean;
  randomizeAudio: boolean;
  randomizeFonts: boolean;
  canvasNoiseLevel?: number;
  audioNoiseLevel?: number;
}): string {
  const scripts: string[] = [];

  if (config.randomizeCanvas) {
    scripts.push(randomizeCanvasScript(config.canvasNoiseLevel));
  }

  if (config.randomizeWebGL) {
    scripts.push(randomizeWebGLScript());
  }

  if (config.randomizeAudio) {
    scripts.push(randomizeAudioScript(config.audioNoiseLevel));
  }

  if (config.randomizeFonts) {
    scripts.push(randomizeFontsScript());
  }

  return scripts.join('\n\n');
}
