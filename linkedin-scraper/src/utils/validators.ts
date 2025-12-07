import { z } from 'zod';

export const ScrapeOptionsSchema = z.object({
  position: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.array(z.string()).optional(),
  employmentType: z.array(z.string()).optional(),
  datePosted: z.string().optional(),
  remoteOption: z.string().optional(),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  limit: z.number().min(1).max(1000).default(50)
});

export const JobSchema = z.object({
  job_id: z.string(),
  title: z.string(),
  company: z.string(),
  company_id: z.string().optional(),
  location: z.string(),
  description: z.string(),
  employment_type: z.string().optional(),
  seniority_level: z.string().optional(),
  industry: z.string().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  salary_currency: z.string().optional(),
  job_url: z.string().url(),
  apply_url: z.string().url().optional(),
  posted_at: z.date(),
  scraped_at: z.date(),
  search_id: z.number(),
  raw_data: z.string()
});

export function validateScrapeOptions(options: unknown) {
  return ScrapeOptionsSchema.parse(options);
}

export function validateJob(job: unknown) {
  return JobSchema.parse(job);
}

export const EXPERIENCE_LEVELS = [
  'Internship',
  'Entry Level',
  'Associate',
  'Mid-Senior',
  'Director',
  'Executive'
] as const;

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Temporary',
  'Volunteer',
  'Internship'
] as const;

export const DATE_POSTED_OPTIONS = [
  'Past 24 hours',
  'Past Week',
  'Past Month',
  'Any time'
] as const;

export const REMOTE_OPTIONS = [
  'On-site',
  'Remote',
  'Hybrid'
] as const;
