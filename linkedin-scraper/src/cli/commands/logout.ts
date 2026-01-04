import { Command } from 'commander';
import chalk from 'chalk';
import { SessionManager } from '../../scraper/auth/SessionManager.js';
import { logger } from '../../utils/logger.js';

export function createLogoutCommand(): Command {
  const command = new Command('logout');

  command
    .description('Clear saved LinkedIn session')
    .action(async () => {
      try {
        const sessionManager = new SessionManager();

        if (!sessionManager.sessionExists()) {
          console.log(chalk.yellow('\nNo active session found.'));
          console.log(chalk.dim('Nothing to logout from.\n'));
          return;
        }

        // Clear session
        await sessionManager.clearSession();

        console.log(chalk.green.bold('\n✓ Logged out successfully.'));
        console.log(chalk.white('Session cleared from disk.\n'));
        console.log(chalk.dim('Run "npm run dev login" to login again.\n'));
      } catch (error) {
        console.error(chalk.red('\n✗ Error:'), error instanceof Error ? error.message : String(error));
        logger.error('Logout command failed:', error);
        process.exit(1);
      }
    });

  return command;
}
