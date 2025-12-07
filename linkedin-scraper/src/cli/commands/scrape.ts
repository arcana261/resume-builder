import { Command } from 'commander';
import { ScraperService } from '../../services/ScraperService.js';
import { promptScrapeOptions } from '../prompts/scrapePrompts.js';
import { validateScrapeOptions } from '../../utils/validators.js';
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import type { ScrapeOptions } from '../../types/index.js';

export function createScrapeCommand(): Command {
  const command = new Command('scrape');

  command
    .description('Scrape LinkedIn job postings')
    .option('-p, --position <position>', 'Job position/title')
    .option('-l, --location <location>', 'Location')
    .option('-e, --experience-level <levels...>', 'Experience levels')
    .option('-t, --employment-type <types...>', 'Employment types')
    .option('-d, --date-posted <date>', 'Date posted filter')
    .option('-n, --limit <number>', 'Maximum number of jobs to scrape', '50')
    .option('-i, --interactive', 'Interactive mode with prompts')
    .action(async (options) => {
      try {
        let scrapeOptions: ScrapeOptions;

        if (options.interactive) {
          // Interactive mode
          console.log(chalk.cyan.bold('\n🔍 LinkedIn Job Scraper\n'));
          scrapeOptions = await promptScrapeOptions();
        } else {
          // CLI arguments mode
          scrapeOptions = {
            position: options.position,
            location: options.location,
            experienceLevel: options.experienceLevel,
            employmentType: options.employmentType,
            datePosted: options.datePosted,
            limit: parseInt(options.limit)
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
        console.log('');

        // Run scraper
        const scraper = new ScraperService();
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
