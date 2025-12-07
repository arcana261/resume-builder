import Table from 'cli-table3';
import chalk from 'chalk';
import type { Job } from '../../types/index.js';
import { formatDateForDisplay } from '../../utils/dateHelpers.js';

export class JobTable {
  static display(jobs: Job[], limit?: number): void {
    if (jobs.length === 0) {
      console.log(chalk.yellow('\nNo jobs found.'));
      return;
    }

    const displayJobs = limit ? jobs.slice(0, limit) : jobs;

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('Title'),
        chalk.cyan('Company'),
        chalk.cyan('Location'),
        chalk.cyan('Posted')
      ],
      colWidths: [6, 30, 20, 20, 15],
      wordWrap: true,
      style: {
        head: [],
        border: ['gray']
      }
    });

    displayJobs.forEach(job => {
      table.push([
        job.id?.toString() || '',
        this.truncate(job.title, 28),
        this.truncate(job.company, 18),
        this.truncate(job.location, 18),
        formatDateForDisplay(job.posted_at)
      ]);
    });

    console.log('\n' + table.toString());

    if (jobs.length > (limit || jobs.length)) {
      console.log(chalk.gray(`\n... and ${jobs.length - (limit || 0)} more jobs`));
    }

    console.log(chalk.gray(`\nTotal: ${jobs.length} jobs\n`));
  }

  static displayDetailed(job: Job): void {
    console.log('\n' + chalk.bold.cyan('Job Details'));
    console.log('─'.repeat(60));
    console.log(chalk.bold('Title:        ') + job.title);
    console.log(chalk.bold('Company:      ') + job.company);
    console.log(chalk.bold('Location:     ') + job.location);
    console.log(chalk.bold('Posted:       ') + formatDateForDisplay(job.posted_at));

    if (job.employment_type) {
      console.log(chalk.bold('Type:         ') + job.employment_type);
    }

    if (job.seniority_level) {
      console.log(chalk.bold('Level:        ') + job.seniority_level);
    }

    if (job.salary_min || job.salary_max) {
      const salaryRange = [
        job.salary_min ? `${job.salary_currency || '$'}${job.salary_min}` : null,
        job.salary_max ? `${job.salary_currency || '$'}${job.salary_max}` : null
      ].filter(Boolean).join(' - ');

      console.log(chalk.bold('Salary:       ') + salaryRange);
    }

    console.log(chalk.bold('URL:          ') + chalk.blue.underline(job.job_url));

    if (job.apply_url) {
      console.log(chalk.bold('Apply URL:    ') + chalk.blue.underline(job.apply_url));
    }

    console.log('\n' + chalk.bold('Description:'));
    console.log('─'.repeat(60));

    // Strip HTML tags and display description
    const plainDescription = job.description
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    console.log(plainDescription.substring(0, 500) + (plainDescription.length > 500 ? '...' : ''));
    console.log('');
  }

  private static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - 3) + '...';
  }
}
