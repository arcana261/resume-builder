import { Command } from 'commander';
import chalk from 'chalk';
import { SessionManager } from '../../scraper/auth/SessionManager.js';
import { logger } from '../../utils/logger.js';

export function createSessionCommand(): Command {
  const command = new Command('session');

  command
    .description('Show LinkedIn session status')
    .action(async () => {
      try {
        const sessionManager = new SessionManager();

        if (!sessionManager.sessionExists()) {
          console.log(chalk.yellow('\n📭 No active session found.'));
          console.log(chalk.white('\nRun "npm run dev login" to create a session.\n'));
          return;
        }

        // Get session info
        const age = sessionManager.getSessionAge();
        const sessionPath = sessionManager.getSessionPath();

        if (age === null) {
          console.log(chalk.red('\n✗ Session file corrupt or unreadable.\n'));
          return;
        }

        // Calculate age in human-readable format
        const ageSeconds = Math.floor(age / 1000);
        const ageMinutes = Math.floor(ageSeconds / 60);
        const ageHours = Math.floor(ageMinutes / 60);
        const ageDays = Math.floor(ageHours / 24);

        let ageStr = '';
        if (ageDays > 0) {
          ageStr = `${ageDays}d ${ageHours % 24}h`;
        } else if (ageHours > 0) {
          ageStr = `${ageHours}h ${ageMinutes % 60}m`;
        } else if (ageMinutes > 0) {
          ageStr = `${ageMinutes}m`;
        } else {
          ageStr = `${ageSeconds}s`;
        }

        // Check if expired (24 hours)
        const isExpired = age > 86400000;

        console.log(chalk.cyan('\n📊 Session Status'));
        console.log(chalk.white('─'.repeat(50)));
        console.log(chalk.white(`Status:   ${isExpired ? chalk.red('Expired') : chalk.green('Active')}`));
        console.log(chalk.white(`Age:      ${ageStr}`));
        console.log(chalk.white(`Location: ${chalk.dim(sessionPath)}`));
        console.log(chalk.white('─'.repeat(50)));

        if (isExpired) {
          console.log(chalk.yellow('\n⚠️  Session has expired (> 24 hours).'));
          console.log(chalk.white('Run "npm run dev login" to refresh.\n'));
        } else {
          console.log(chalk.green('\n✓ Session is active and ready to use.\n'));
        }
      } catch (error) {
        console.error(chalk.red('\n✗ Error:'), error instanceof Error ? error.message : String(error));
        logger.error('Session command failed:', error);
        process.exit(1);
      }
    });

  return command;
}
