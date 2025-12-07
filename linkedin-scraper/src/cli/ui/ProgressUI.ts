import cliProgress from 'cli-progress';
import ora, { Ora } from 'ora';
import chalk from 'chalk';
import boxen from 'boxen';

export class ProgressUI {
  private multibar: cliProgress.MultiBar | null = null;
  private mainProgress: cliProgress.SingleBar | null = null;
  private spinner: Ora | null = null;
  private stats = {
    total: 0,
    success: 0,
    failed: 0,
    duplicates: 0,
    startTime: 0
  };

  start(total: number): void {
    this.stats.total = total;
    this.stats.startTime = Date.now();

    this.multibar = new cliProgress.MultiBar({
      format: chalk.cyan('{bar}') + ' {percentage}% | ETA: {eta}s | {value}/{total} jobs',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      clearOnComplete: false,
      stopOnComplete: true
    }, cliProgress.Presets.shades_classic);

    this.mainProgress = this.multibar.create(total, 0);
    this.spinner = ora('Initializing scraper...').start();
  }

  update(current: number, message: string): void {
    if (this.mainProgress) {
      this.mainProgress.update(current);
    }

    if (this.spinner) {
      this.spinner.text = chalk.gray(`→ ${message}`);
    }
  }

  incrementSuccess(): void {
    this.stats.success++;
    this.updateProgress();
  }

  incrementFailed(): void {
    this.stats.failed++;
    this.updateProgress();
  }

  incrementDuplicates(): void {
    this.stats.duplicates++;
  }

  private updateProgress(): void {
    const current = this.stats.success + this.stats.failed + this.stats.duplicates;
    if (this.mainProgress) {
      this.mainProgress.update(current);
    }
  }

  complete(): void {
    if (this.multibar) {
      this.multibar.stop();
    }

    if (this.spinner) {
      this.spinner.succeed(chalk.green('Scraping completed successfully!'));
    }

    this.displaySummary();
  }

  fail(message: string): void {
    if (this.multibar) {
      this.multibar.stop();
    }

    if (this.spinner) {
      this.spinner.fail(chalk.red(message));
    }
  }

  private displaySummary(): void {
    const elapsed = Date.now() - this.stats.startTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const summary = `
${chalk.bold('Summary')}
${'─'.repeat(45)}
${chalk.cyan('Total Jobs Found:')}     ${this.stats.total}
${chalk.green('Successfully Scraped:')} ${this.stats.success}
${chalk.red('Failed:')}              ${this.stats.failed}
${chalk.yellow('Duplicates:')}          ${this.stats.duplicates}
${chalk.gray('Time Elapsed:')}        ${timeString}
    `.trim();

    console.log('\n' + boxen(summary, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }));
  }

  displayLiveStats(): void {
    const elapsed = Date.now() - this.stats.startTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);
    const rate = this.stats.success / (elapsedSeconds || 1) * 60;

    console.log(chalk.gray(`
→ Success: ${chalk.green(this.stats.success)} | Failed: ${chalk.red(this.stats.failed)} | Duplicates: ${chalk.yellow(this.stats.duplicates)}
→ Rate: ${chalk.cyan(rate.toFixed(1))} jobs/min
    `.trim()));
  }
}
