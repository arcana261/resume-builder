import { Command } from 'commander';
import { JobRepository } from '../../database/repositories/JobRepository.js';
import { SearchRepository } from '../../database/repositories/SearchRepository.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

export function createClearCommand(): Command {
  const command = new Command('clear');

  command
    .description('Clear all scraped data from database')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (options) => {
      try {
        let confirm = options.yes;

        if (!confirm) {
          const answer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: chalk.yellow('⚠️  This will delete ALL scraped jobs and searches. Are you sure?'),
              default: false
            }
          ]);

          confirm = answer.confirm;
        }

        if (!confirm) {
          console.log(chalk.gray('\nOperation cancelled.'));
          return;
        }

        const jobRepo = new JobRepository();
        const searchRepo = new SearchRepository();

        const jobCount = await jobRepo.count();
        const searches = await searchRepo.findAll();

        await jobRepo.deleteAll();
        await searchRepo.deleteAll();

        console.log(chalk.green(`\n✓ Deleted ${jobCount} jobs and ${searches.length} searches`));
      } catch (error) {
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
