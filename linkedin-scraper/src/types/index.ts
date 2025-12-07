export interface Job {
  id?: number;
  job_id: string;
  title: string;
  company: string;
  company_id?: string;
  location: string;
  description: string;
  employment_type?: string;
  seniority_level?: string;
  industry?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  job_url: string;
  apply_url?: string;
  posted_at: Date;
  scraped_at: Date;
  search_id: number;
  raw_data: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Search {
  id?: number;
  query: string;
  location: string;
  filters: string;
  total_results: number;
  successful_scrapes: number;
  failed_scrapes: number;
  started_at: Date;
  completed_at?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  created_at?: Date;
}

export interface ScrapeError {
  id?: number;
  search_id: number;
  job_id?: string;
  error_type: string;
  error_message: string;
  url?: string;
  occurred_at: Date;
}

export interface ScrapeOptions {
  position?: string;
  location?: string;
  experienceLevel?: string[];
  employmentType?: string[];
  datePosted?: string;
  remoteOption?: string;
  salary?: { min?: number; max?: number };
  limit: number;
}

export interface JobFilters {
  position?: string;
  location?: string;
  experienceLevel?: string[];
  employmentType?: string[];
  datePosted?: string;
  remoteOption?: string;
  salary?: { min?: number; max?: number };
}

export interface JobCard {
  id: string;
  selector: string;
  title: string;
  company: string;
  location: string;
}

export interface JobData {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  location: string;
  description: string;
  employmentType?: string;
  seniorityLevel?: string;
  industry?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  url: string;
  applyUrl?: string;
  postedDate: string;
}

export interface ScrapeResult {
  searchId: number;
  totalScraped: number;
  success: boolean;
  errors?: string[];
}

export interface ErrorContext {
  attempts: number;
  jobId?: string;
  url?: string;
  searchId?: number;
}

export interface ErrorAction {
  action: 'retry' | 'skip' | 'pause' | 'abort';
  delay?: number;
  logToDb?: boolean;
  notify?: boolean;
}

export interface Config {
  database: {
    path: string;
  };
  scraping: {
    maxConcurrentRequests: number;
    requestDelayMin: number;
    requestDelayMax: number;
    maxPagesPerSearch: number;
    maxRetries: number;
  };
  proxy?: {
    enabled: boolean;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
  logging: {
    level: string;
    file: string;
  };
  browser: {
    headless: boolean;
    type: 'chromium' | 'firefox' | 'webkit';
  };
}
