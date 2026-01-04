import { Command } from 'commander';
import { createScrapeCommand } from './commands/scrape.js';
import { createListCommand } from './commands/list.js';
import { createExportCommand } from './commands/export.js';
import { createClearCommand } from './commands/clear.js';
import { createLoginCommand } from './commands/login.js';
import { createLogoutCommand } from './commands/logout.js';
import { createSessionCommand } from './commands/session.js';
import chalk from 'chalk';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('linkedin-scraper')
    .description(chalk.cyan('LinkedIn Job Scraper - Extract job postings from LinkedIn'))
    .version('1.0.0');

  // Add commands
  program.addCommand(createScrapeCommand());
  program.addCommand(createListCommand());
  program.addCommand(createExportCommand());
  program.addCommand(createClearCommand());
  program.addCommand(createLoginCommand());
  program.addCommand(createLogoutCommand());
  program.addCommand(createSessionCommand());

  // Display help by default if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }

  return program;
}
