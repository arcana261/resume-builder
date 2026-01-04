import { Command } from 'commander';
import chalk from 'chalk';
import { Browser } from '../../scraper/core/Browser.js';
import { SessionManager } from '../../scraper/auth/SessionManager.js';
import { LoginDetector } from '../../scraper/auth/LoginDetector.js';
import { logger } from '../../utils/logger.js';

export function createLoginCommand(): Command {
  const command = new Command('login');

  command
    .description('Login to LinkedIn and save session')
    .action(async () => {
      try {
        // Show security warning
        showSecurityWarning();

        // Give user 5 seconds to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log(chalk.blue('\nLaunching browser...'));

        // Launch browser (always headed)
        const browser = new Browser({
          headless: false,  // Always headed for login
          stealth: true
        });
        await browser.launch();

        // Navigate to LinkedIn login
        const loginDetector = new LoginDetector();
        await loginDetector.navigateToLogin(browser.getPage());

        // Show instructions to user
        console.log(chalk.cyan('\n📋 Instructions:'));
        console.log(chalk.white('  1. Log in to LinkedIn in the browser window'));
        console.log(chalk.white('  2. Complete 2FA if prompted'));
        console.log(chalk.white('  3. Wait for confirmation message\n'));
        console.log(chalk.dim('  Waiting for successful login...'));

        // Wait for login (5 minute timeout)
        await loginDetector.waitForLogin(browser.getPage(), 300000);

        // Save session
        console.log(chalk.blue('\nSaving session...'));
        const sessionManager = new SessionManager();
        await sessionManager.saveSession(
          browser.getContext(),
          browser.getPage()
        );

        // Show success message
        console.log(chalk.green.bold('\n✓ Login successful! Session saved.'));
        console.log(chalk.white(`Session saved to: ${sessionManager.getSessionPath()}`));
        console.log(chalk.white('\nYou can now run scraping commands:'));
        console.log(chalk.dim('  npm run dev scrape --position "Engineer"\n'));

        // Close browser
        await browser.close();
      } catch (error) {
        console.error(chalk.red('\n✗ Error:'), error instanceof Error ? error.message : String(error));
        logger.error('Login command failed:', error);
        process.exit(1);
      }
    });

  return command;
}

function showSecurityWarning(): void {
  console.log(chalk.yellow.bold('\n⚠️  SECURITY WARNING ⚠️\n'));
  console.log(chalk.white('LinkedIn Terms of Service PROHIBIT automated scraping.'));
  console.log(chalk.white('Using this feature may result in account suspension.\n'));
  console.log(chalk.white('Recommendations:'));
  console.log(chalk.white('  • Use a separate LinkedIn account for testing'));
  console.log(chalk.white('  • Limit scraping volume (< 50 jobs/day)'));
  console.log(chalk.white('  • Never share session files'));
  console.log(chalk.white('  • Session stored in: data/linkedin-session.json\n'));
  console.log(chalk.dim('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n'));
}
