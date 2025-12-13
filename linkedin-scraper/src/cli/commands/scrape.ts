import { Command } from 'commander';
import { ScraperService } from '../../services/ScraperService.js';
import { promptScrapeOptions } from '../prompts/scrapePrompts.js';
import { validateScrapeOptions } from '../../utils/validators.js';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import type { ScrapeOptions } from '../../types/index.js';
import type { AntiDetectionConfig } from '../../scraper/anti-detection/index.js';

/**
 * Get anti-detection configuration profile
 */
function getAntiDetectionProfile(profile: string): Partial<AntiDetectionConfig> {
  switch (profile) {
    case 'conservative':
      // Maximum stealth, slower but safest
      return {
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
        stealth: {
          hideWebDriver: true,
          injectChrome: true,
          overridePermissions: true,
          patchNavigator: true,
          hideAutomation: true
        },
        timing: {
          requestDelayMin: 5000,
          requestDelayMax: 10000,
          pageDelayMin: 2000,
          pageDelayMax: 4000,
          readingTimeMultiplier: 1.5,
          randomizeTimings: true
        }
      };

    case 'aggressive':
      // Minimal stealth, faster but riskier
      return {
        fingerprint: {
          randomizeViewport: true,
          randomizeUserAgent: true,
          randomizeLocale: false,
          randomizeTimezone: false,
          randomizeCanvas: false,
          randomizeWebGL: false,
          randomizeAudio: false,
          randomizeFonts: false
        },
        behavior: {
          enableMouseMovement: false,
          enableScrollSimulation: false,
          enableReadingTime: false,
          enableTypingSimulation: false,
          humanLikeDelays: false
        },
        stealth: {
          hideWebDriver: true,
          injectChrome: true,
          overridePermissions: true,
          patchNavigator: true,
          hideAutomation: true
        },
        timing: {
          requestDelayMin: 1000,
          requestDelayMax: 3000,
          pageDelayMin: 500,
          pageDelayMax: 1500,
          readingTimeMultiplier: 0.5,
          randomizeTimings: false
        }
      };

    case 'balanced':
    default:
      // Default balanced approach
      return {
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
        }
      };
  }
}

/**
 * Build CLI command string from scrape options
 */
function buildCliCommand(options: ScrapeOptions): string {
  const args: string[] = ['linkedin-scraper scrape'];

  if (options.position) {
    args.push(`--position "${options.position}"`);
  }

  if (options.location) {
    args.push(`--location "${options.location}"`);
  }

  if (options.experienceLevel && options.experienceLevel.length > 0) {
    args.push(`--experience-level ${options.experienceLevel.map(level => `"${level}"`).join(' ')}`);
  }

  if (options.employmentType && options.employmentType.length > 0) {
    args.push(`--employment-type ${options.employmentType.map(type => `"${type}"`).join(' ')}`);
  }

  if (options.datePosted) {
    args.push(`--date-posted "${options.datePosted}"`);
  }

  if (options.remoteOption) {
    args.push(`--remote-option "${options.remoteOption}"`);
  }

  if (options.limit) {
    args.push(`--limit ${options.limit}`);
  }

  if (options.refresh) {
    args.push(`--refresh`);
  }

  return args.join(' ');
}

export function createScrapeCommand(): Command {
  const command = new Command('scrape');

  command
    .description('Scrape LinkedIn job postings')
    .option('-p, --position <position>', 'Job position/title')
    .option('-l, --location <location>', 'Location')
    .option('-e, --experience-level <levels...>', 'Experience levels')
    .option('-t, --employment-type <types...>', 'Employment types')
    .option('-d, --date-posted <date>', 'Date posted filter')
    .option('-r, --remote-option <option>', 'Remote work option (On-site, Remote, Hybrid)')
    .option('-n, --limit <number>', 'Maximum number of jobs to scrape', '50')
    .option('-i, --interactive', 'Interactive mode with prompts')
    .option('--refresh', 'Force refresh existing job postings')
    .option('--headed', 'Show browser window (default: headless)')
    .option('--log-browser-errors', 'Log browser page errors (default: false)')
    .option('--anti-detection-profile <profile>', 'Anti-detection profile: conservative, balanced, aggressive (default: balanced)', 'balanced')
    .option('--disable-anti-detection', 'Disable all anti-detection features')
    .option('--validate-stealth', 'Validate stealth implementation before scraping')
    .action(async (options) => {
      try {
        let scrapeOptions: ScrapeOptions;

        if (options.interactive) {
          // Interactive mode
          console.log(chalk.cyan.bold('\n🔍 LinkedIn Job Scraper\n'));
          scrapeOptions = await promptScrapeOptions();

          // Log equivalent CLI command
          logger.info('Interactive mode completed - equivalent CLI command:', {
            command: buildCliCommand(scrapeOptions)
          });
          console.log(chalk.gray('\n💡 Equivalent CLI command:'));
          console.log(chalk.white(buildCliCommand(scrapeOptions)));
          console.log('');
        } else {
          // CLI arguments mode
          scrapeOptions = {
            position: options.position,
            location: options.location,
            experienceLevel: options.experienceLevel,
            employmentType: options.employmentType,
            datePosted: options.datePosted,
            remoteOption: options.remoteOption,
            limit: parseInt(options.limit),
            refresh: options.refresh || false
          };

          // Validate options
          try {
            scrapeOptions = validateScrapeOptions(scrapeOptions);
          } catch (error) {
            console.error(chalk.red('Invalid options:'), error instanceof Error ? error.message : String(error));
            console.log(chalk.yellow('\nTip: Use --interactive for guided setup'));
            process.exit(1);
          }
        }

        // Display selected options
        console.log(chalk.cyan('\nScraping with options:'));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(chalk.white('Position:'), scrapeOptions.position || chalk.gray('Any'));
        console.log(chalk.white('Location:'), scrapeOptions.location || chalk.gray('Any'));
        console.log(chalk.white('Limit:'), scrapeOptions.limit);
        if (scrapeOptions.experienceLevel && scrapeOptions.experienceLevel.length > 0) {
          console.log(chalk.white('Experience:'), scrapeOptions.experienceLevel.join(', '));
        }
        if (scrapeOptions.employmentType && scrapeOptions.employmentType.length > 0) {
          console.log(chalk.white('Type:'), scrapeOptions.employmentType.join(', '));
        }
        if (scrapeOptions.refresh) {
          console.log(chalk.white('Refresh:'), chalk.yellow('Yes (will update existing jobs)'));
        }
        if (options.headed) {
          console.log(chalk.white('Browser:'), chalk.yellow('Visible (headed mode)'));
        }

        // Display anti-detection configuration
        if (options.disableAntiDetection) {
          console.log(chalk.white('Anti-Detection:'), chalk.red('Disabled'));
        } else {
          const profileColor =
            options.antiDetectionProfile === 'conservative' ? 'green' :
            options.antiDetectionProfile === 'aggressive' ? 'yellow' : 'cyan';
          console.log(chalk.white('Anti-Detection:'), chalk[profileColor](options.antiDetectionProfile));
        }

        if (options.validateStealth) {
          console.log(chalk.white('Stealth Validation:'), chalk.cyan('Enabled'));
        }
        console.log('');

        // Build anti-detection configuration
        let antiDetectionConfig: Partial<AntiDetectionConfig> | undefined;
        if (options.disableAntiDetection) {
          // Disable all anti-detection features
          antiDetectionConfig = {
            fingerprint: {
              randomizeViewport: false,
              randomizeUserAgent: false,
              randomizeLocale: false,
              randomizeTimezone: false,
              randomizeCanvas: false,
              randomizeWebGL: false,
              randomizeAudio: false,
              randomizeFonts: false
            },
            stealth: {
              hideWebDriver: false,
              injectChrome: false,
              overridePermissions: false,
              patchNavigator: false,
              hideAutomation: false
            }
          };
        } else {
          // Use selected profile
          antiDetectionConfig = getAntiDetectionProfile(options.antiDetectionProfile);
        }

        // Run scraper
        const scraper = new ScraperService({
          logBrowserErrors: options.logBrowserErrors || false,
          headless: !options.headed,  // If --headed is true, headless should be false
          antiDetectionConfig
        });

        // Validate stealth if requested
        if (options.validateStealth && !options.disableAntiDetection) {
          console.log(chalk.cyan('Validating stealth implementation...\n'));
          try {
            await scraper.validateStealth();
            console.log(chalk.green('✓ Stealth validation passed\n'));
          } catch (error) {
            console.log(chalk.yellow('⚠ Stealth validation completed with warnings\n'));
            logger.warn('Stealth validation completed with warnings', { error });
          }
        }

        const result = await scraper.scrape(scrapeOptions);

        if (result.success) {
          console.log(chalk.green(`\n✓ Successfully scraped ${result.totalScraped} jobs`));
          console.log(chalk.gray(`Search ID: ${result.searchId}`));
          console.log(chalk.gray(`\nUse ${chalk.white('linkedin-scraper list --search-id ' + result.searchId)} to view results`));
        } else {
          console.error(chalk.red('\n✗ Scraping failed'));
          if (result.errors && result.errors.length > 0) {
            result.errors.forEach(err => console.error(chalk.red('  -', err)));
          }
          process.exit(1);
        }
      } catch (error) {
        logger.error('Command failed', { error });
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
