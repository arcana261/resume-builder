import { Command } from 'commander';
import { ScraperService } from '../../services/ScraperService.js';
import { promptScrapeOptions } from '../prompts/scrapePrompts.js';
import { validateScrapeOptions } from '../../utils/validators.js';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import type { ScrapeOptions } from '../../types/index.js';

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
    .option('--log-browser-errors', 'Log browser page errors (default: false)')
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
        console.log('');

        // Run scraper
        const scraper = new ScraperService({ logBrowserErrors: options.logBrowserErrors || false });
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
