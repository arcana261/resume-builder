import inquirer from 'inquirer';
import { EXPERIENCE_LEVELS, EMPLOYMENT_TYPES, DATE_POSTED_OPTIONS } from '../../utils/validators.js';
import type { ScrapeOptions } from '../../types/index.js';

export async function promptScrapeOptions(): Promise<ScrapeOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: 'Job position/title to search:',
      validate: (input: string) => input.length > 0 || 'Position is required'
    },
    {
      type: 'input',
      name: 'location',
      message: 'Location:',
      default: 'United States'
    },
    {
      type: 'checkbox',
      name: 'experienceLevel',
      message: 'Experience level (select multiple with space):',
      choices: ['Any', ...EXPERIENCE_LEVELS],
      default: ['Any']
    },
    {
      type: 'checkbox',
      name: 'employmentType',
      message: 'Employment type (select multiple with space):',
      choices: ['Any', ...EMPLOYMENT_TYPES],
      default: ['Any']
    },
    {
      type: 'list',
      name: 'datePosted',
      message: 'Date posted:',
      choices: DATE_POSTED_OPTIONS,
      default: 'Any time'
    },
    {
      type: 'number',
      name: 'limit',
      message: 'Maximum jobs to scrape:',
      default: 50,
      validate: (value: number) => {
        if (value <= 0) return 'Must be greater than 0';
        if (value > 1000) return 'Maximum is 1000';
        return true;
      }
    }
  ]);

  // Convert "Any" selections to empty arrays
  const experienceLevel = answers.experienceLevel.includes('Any')
    ? []
    : answers.experienceLevel;

  const employmentType = answers.employmentType.includes('Any')
    ? []
    : answers.employmentType;

  return {
    position: answers.position,
    location: answers.location,
    experienceLevel,
    employmentType,
    datePosted: answers.datePosted === 'Any time' ? undefined : answers.datePosted,
    limit: answers.limit
  };
}
