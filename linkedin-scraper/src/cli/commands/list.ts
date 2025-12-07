import { Command } from 'commander';
import { JobRepository } from '../../database/repositories/JobRepository.js';
import { JobTable } from '../ui/JobTable.js';
import chalk from 'chalk';

export function createListCommand(): Command {
  const command = new Command('list');

  command
    .description('List scraped jobs')
    .option('-s, --search-id <id>', 'Filter by search ID')
    .option('-c, --company <name>', 'Filter by company name')
    .option('-l, --location <location>', 'Filter by location')
    .option('-f, --date-from <date>', 'Filter by date (YYYY-MM-DD)')
    .option('-n, --limit <number>', 'Limit number of results', '20')
    .action(async (options) => {
      try {
        const jobRepo = new JobRepository();
        let jobs;

        if (options.searchId) {
          const searchId = parseInt(options.searchId);
          jobs = await jobRepo.findBySearchId(searchId, options.limit ? parseInt(options.limit) : undefined);
        } else {
          const filters: any = {
            limit: parseInt(options.limit)
          };

          if (options.company) {
            filters.company = options.company;
          }

          if (options.location) {
            filters.location = options.location;
          }

          if (options.dateFrom) {
            filters.dateFrom = new Date(options.dateFrom);
          }

          jobs = await jobRepo.findAll(filters);
        }

        if (jobs.length === 0) {
          console.log(chalk.yellow('\nNo jobs found matching the criteria.'));
          return;
        }

        JobTable.display(jobs, parseInt(options.limit));
      } catch (error) {
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
