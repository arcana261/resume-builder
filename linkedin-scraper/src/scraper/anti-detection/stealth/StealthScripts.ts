/**
 * Stealth Scripts
 *
 * Collection of stealth scripts to inject into browser context
 * to avoid detection through JavaScript-based fingerprinting.
 */

/**
 * Hide WebDriver Flag
 * Overrides navigator.webdriver to return false
 */
export function hideWebDriverScript(): string {
  return `
    // Override navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
      configurable: true
    });

    // Remove webdriver from navigator prototype
    delete Object.getPrototypeOf(navigator).webdriver;
  `;
}

/**
 * Inject Chrome Object
 * Adds window.chrome object to make browser appear more like real Chrome
 */
export function injectChromeObjectScript(): string {
  return `
    // Add Chrome object if not present
    if (!window.chrome) {
      window.chrome = {
        runtime: {
          OnInstalledReason: {
            CHROME_UPDATE: "chrome_update",
            INSTALL: "install",
            SHARED_MODULE_UPDATE: "shared_module_update",
            UPDATE: "update"
          },
          OnRestartRequiredReason: {
            APP_UPDATE: "app_update",
            OS_UPDATE: "os_update",
            PERIODIC: "periodic"
          },
          PlatformArch: {
            ARM: "arm",
            ARM64: "arm64",
            MIPS: "mips",
            MIPS64: "mips64",
            X86_32: "x86-32",
            X86_64: "x86-64"
          },
          PlatformNaclArch: {
            ARM: "arm",
            MIPS: "mips",
            MIPS64: "mips64",
            X86_32: "x86-32",
            X86_64: "x86-64"
          },
          PlatformOs: {
            ANDROID: "android",
            CROS: "cros",
            LINUX: "linux",
            MAC: "mac",
            OPENBSD: "openbsd",
            WIN: "win"
          },
          RequestUpdateCheckStatus: {
            NO_UPDATE: "no_update",
            THROTTLED: "throttled",
            UPDATE_AVAILABLE: "update_available"
          }
        },
        csi: () => {},
        loadTimes: () => {},
        app: {}
      };
    }
  `;
}

/**
 * Override Permissions
 * Patches permissions.query to avoid permission-based detection
 */
export function overridePermissionsScript(): string {
  return `
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => {
      if (parameters.name === 'notifications') {
        return Promise.resolve({
          state: Notification.permission,
          onchange: null
        });
      }
      return originalQuery.call(window.navigator.permissions, parameters);
    };
  `;
}

/**
 * Patch Navigator Properties
 * Adds/modifies navigator properties to appear more human
 */
export function patchNavigatorScript(): string {
  return `
    // Add missing navigator properties that real browsers have
    if (!navigator.connection) {
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 50,
          downlink: 10,
          saveData: false,
          onchange: null
        }),
        configurable: true
      });
    }

    // Add vendor
    if (!navigator.vendor || navigator.vendor === '') {
      Object.defineProperty(navigator, 'vendor', {
        get: () => 'Google Inc.',
        configurable: true
      });
    }

    // Add PDF viewer plugin
    if (!navigator.pdfViewerEnabled) {
      Object.defineProperty(navigator, 'pdfViewerEnabled', {
        get: () => true,
        configurable: true
      });
    }

    // Add plugins
    if (navigator.plugins && navigator.plugins.length === 0) {
      // Define realistic plugins
      const pluginsData = [
        {
          name: 'PDF Viewer',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format'
        },
        {
          name: 'Chrome PDF Viewer',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format'
        },
        {
          name: 'Chromium PDF Viewer',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format'
        },
        {
          name: 'Microsoft Edge PDF Viewer',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format'
        },
        {
          name: 'WebKit built-in PDF',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format'
        }
      ];

      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const plugins = pluginsData.map((data, index) => ({
            ...data,
            length: 1,
            item: (i) => i === 0 ? { type: 'application/pdf', suffixes: 'pdf', description: data.description } : null,
            namedItem: (name) => name === 'application/pdf' ? { type: 'application/pdf', suffixes: 'pdf', description: data.description } : null,
            [0]: { type: 'application/pdf', suffixes: 'pdf', description: data.description }
          }));

          plugins.item = function(index) {
            return plugins[index] || null;
          };

          plugins.namedItem = function(name) {
            return plugins.find(p => p.name === name) || null;
          };

          plugins.refresh = function() {};

          return plugins;
        },
        configurable: true
      });
    }
  `;
}

/**
 * Hide Automation Features
 * Removes automation-related properties and methods
 */
export function hideAutomationScript(): string {
  return `
    // Remove automation-related properties
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Object;
    delete window.cdc_adoQpoasnfa76pfcZLmcfl_Proxy;

    // Remove __webdriver_script_fn markers
    const descriptorKeys = Object.keys(Object.getOwnPropertyDescriptors(Navigator.prototype));
    descriptorKeys.forEach(key => {
      const descriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, key);
      if (descriptor && descriptor.get && descriptor.get.toString().includes('__webdriver_script_fn')) {
        delete Navigator.prototype[key];
      }
    });

    // Patch toString() methods to hide function rewrites
    const originalToString = Function.prototype.toString;
    Function.prototype.toString = function() {
      if (this === navigator.webdriver.get || this === navigator.permissions.query) {
        return 'function() { [native code] }';
      }
      return originalToString.call(this);
    };
  `;
}

/**
 * Add Battery API
 * Simulates battery API with realistic values
 */
export function addBatteryApiScript(): string {
  return `
    if (!navigator.getBattery) {
      navigator.getBattery = () => {
        return Promise.resolve({
          charging: Math.random() > 0.5,
          chargingTime: Infinity,
          dischargingTime: Math.random() * 10000 + 5000,
          level: Math.random() * 0.5 + 0.5,  // 50-100%
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
          onchargingchange: null,
          onchargingtimechange: null,
          ondischargingtimechange: null,
          onlevelchange: null
        });
      };
    }
  `;
}

/**
 * Randomize Media Codecs
 * Adds realistic codec support
 */
export function addMediaCodecsScript(): string {
  return `
    // Add realistic audio codecs
    const audioCodecs = {
      'audio/ogg; codecs="vorbis"': 'probably',
      'audio/mpeg': 'probably',
      'audio/wav; codecs="1"': 'probably',
      'audio/aac': 'probably',
      'audio/webm; codecs="opus"': 'probably',
      'audio/flac': 'probably'
    };

    const videoCodecs = {
      'video/mp4; codecs="avc1.42E01E"': 'probably',
      'video/webm; codecs="vp8"': 'probably',
      'video/webm; codecs="vp9"': 'probably',
      'video/mp4; codecs="av01.0.00M.08"': 'probably'
    };

    // Override HTMLMediaElement.canPlayType
    const originalCanPlayType = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function(type) {
      const audioSupport = audioCodecs[type];
      const videoSupport = videoCodecs[type];

      if (audioSupport) return audioSupport;
      if (videoSupport) return videoSupport;

      return originalCanPlayType.call(this, type);
    };
  `;
}

/**
 * Patch Date and Time APIs
 * Ensures consistent timezone handling
 */
export function patchDateTimeScript(): string {
  return `
    // Store original Date constructor
    const OriginalDate = Date;
    const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

    // Ensure timezone offset is consistent
    Date.prototype.getTimezoneOffset = function() {
      return originalGetTimezoneOffset.call(this);
    };

    // Add realistic timing jitter to performance.now()
    const originalPerformanceNow = performance.now;
    let performanceOffset = Math.random() * 10;
    performance.now = function() {
      return originalPerformanceNow.call(performance) + performanceOffset;
    };
  `;
}

/**
 * Combine All Stealth Scripts
 * Returns a single script that includes all stealth measures
 */
export function getAllStealthScripts(): string {
  return `
    ${hideWebDriverScript()}
    ${injectChromeObjectScript()}
    ${overridePermissionsScript()}
    ${patchNavigatorScript()}
    ${hideAutomationScript()}
    ${addBatteryApiScript()}
    ${addMediaCodecsScript()}
    ${patchDateTimeScript()}
  `;
}
