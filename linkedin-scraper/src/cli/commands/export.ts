import { Command } from 'commander';
import { JobRepository } from '../../database/repositories/JobRepository.js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export function createExportCommand(): Command {
  const command = new Command('export');

  command
    .description('Export scraped jobs to file')
    .option('-s, --search-id <id>', 'Search ID to export')
    .option('-f, --format <format>', 'Export format (json, csv)', 'json')
    .option('-o, --output <file>', 'Output file path')
    .action(async (options) => {
      try {
        const jobRepo = new JobRepository();
        let jobs;

        if (options.searchId) {
          const searchId = parseInt(options.searchId);
          jobs = await jobRepo.findBySearchId(searchId);
        } else {
          jobs = await jobRepo.findAll();
        }

        if (jobs.length === 0) {
          console.log(chalk.yellow('\nNo jobs to export.'));
          return;
        }

        const format = options.format.toLowerCase();
        const outputFile = options.output || `jobs-export-${Date.now()}.${format}`;

        // Ensure output directory exists
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        if (format === 'json') {
          fs.writeFileSync(outputFile, JSON.stringify(jobs, null, 2));
        } else if (format === 'csv') {
          const csv = convertToCSV(jobs);
          fs.writeFileSync(outputFile, csv);
        } else {
          console.error(chalk.red(`\nUnsupported format: ${format}`));
          process.exit(1);
        }

        console.log(chalk.green(`\n✓ Exported ${jobs.length} jobs to ${outputFile}`));
      } catch (error) {
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}

function convertToCSV(jobs: any[]): string {
  if (jobs.length === 0) {
    return '';
  }

  const headers = [
    'ID',
    'Job ID',
    'Title',
    'Company',
    'Location',
    'Employment Type',
    'Seniority Level',
    'Posted At',
    'Job URL'
  ];

  const rows = jobs.map(job => [
    job.id,
    job.job_id,
    `"${job.title.replace(/"/g, '""')}"`,
    `"${job.company.replace(/"/g, '""')}"`,
    `"${job.location.replace(/"/g, '""')}"`,
    job.employment_type || '',
    job.seniority_level || '',
    job.posted_at,
    job.job_url
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}
