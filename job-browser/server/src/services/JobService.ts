import type { Database } from 'better-sqlite3';
import type { Job, JobsQueryParams, FilterOptions, Pagination } from '../../../shared/types.js';
import { DatabaseService } from './DatabaseService.js';

export class JobService {
  private db: Database;

  constructor() {
    this.db = DatabaseService.getInstance().getDatabase();
  }

  public async getJobs(params: JobsQueryParams = {}): Promise<{ data: Job[]; pagination: Pagination; filters: FilterOptions }> {
    const {
      page = 1,
      limit = 20,
      search,
      company,
      location,
      employmentType,
      seniorityLevel,
      industry,
      salaryMin,
      salaryMax,
      postedAfter,
      scrapedAfter,
      sortBy = 'posted_at',
      sortOrder = 'desc'
    } = params;

    const offset = (page - 1) * Math.min(limit, 100);
    const actualLimit = Math.min(limit, 100);

    // Build query conditions
    const conditions: string[] = [];
    const queryParams: any[] = [];

    // Full-text search
    if (search) {
      const searchResults = this.db.prepare(`
        SELECT rowid FROM jobs_fts WHERE jobs_fts MATCH ? ORDER BY rank
      `).all(search) as Array<{ rowid: number }>;

      if (searchResults.length > 0) {
        const ids = searchResults.map(r => r.rowid);
        conditions.push(`j.id IN (${ids.join(',')})`);
      } else {
        // No search results - return empty
        return {
          data: [],
          pagination: { page, limit: actualLimit, total: 0, totalPages: 0 },
          filters: this.getFilterOptions()
        };
      }
    }

    // Filter by company
    if (company && company.length > 0) {
      const placeholders = company.map(() => '?').join(',');
      conditions.push(`j.company IN (${placeholders})`);
      queryParams.push(...company);
    }

    // Filter by location
    if (location && location.length > 0) {
      const placeholders = location.map(() => '?').join(',');
      conditions.push(`j.location IN (${placeholders})`);
      queryParams.push(...location);
    }

    // Filter by employment type
    if (employmentType && employmentType.length > 0) {
      const placeholders = employmentType.map(() => '?').join(',');
      conditions.push(`j.employment_type IN (${placeholders})`);
      queryParams.push(...employmentType);
    }

    // Filter by seniority level
    if (seniorityLevel && seniorityLevel.length > 0) {
      const placeholders = seniorityLevel.map(() => '?').join(',');
      conditions.push(`j.seniority_level IN (${placeholders})`);
      queryParams.push(...seniorityLevel);
    }

    // Filter by industry
    if (industry && industry.length > 0) {
      const placeholders = industry.map(() => '?').join(',');
      conditions.push(`j.industry IN (${placeholders})`);
      queryParams.push(...industry);
    }

    // Filter by salary range
    if (salaryMin !== undefined) {
      conditions.push('j.salary_min >= ?');
      queryParams.push(salaryMin);
    }

    if (salaryMax !== undefined) {
      conditions.push('j.salary_max <= ?');
      queryParams.push(salaryMax);
    }

    // Filter by posted date
    if (postedAfter) {
      conditions.push('j.posted_at >= ?');
      queryParams.push(new Date(postedAfter).getTime() / 1000); // Convert to Unix timestamp
    }

    // Filter by scraped date
    if (scrapedAfter) {
      conditions.push('j.scraped_at >= ?');
      queryParams.push(new Date(scrapedAfter).getTime() / 1000); // Convert to Unix timestamp
    }

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const orderByColumn = sortBy === 'scraped_at' ? 'j.scraped_at' :
                          sortBy === 'salary_min' ? 'j.salary_min' :
                          sortBy === 'salary_max' ? 'j.salary_max' :
                          sortBy === 'title' ? 'j.title' :
                          'j.posted_at';

    const orderDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM jobs j ${whereClause}`;
    const countResult = this.db.prepare(countQuery).get(...queryParams) as { count: number };
    const total = countResult.count;

    // Get paginated data
    const dataQuery = `
      SELECT
        j.id,
        j.job_id,
        j.title,
        j.company,
        j.company_id,
        j.location,
        j.description,
        j.employment_type,
        j.seniority_level,
        j.industry,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        j.job_url,
        j.apply_url,
        j.posted_at,
        j.scraped_at,
        j.search_id,
        j.raw_data,
        j.created_at,
        j.updated_at
      FROM jobs j
      ${whereClause}
      ORDER BY ${orderByColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const data = this.db.prepare(dataQuery).all(...queryParams, actualLimit, offset) as Job[];

    // Convert timestamps to ISO strings
    const formattedData = data.map(job => ({
      ...job,
      posted_at: new Date((job.posted_at as any) * 1000).toISOString(),
      scraped_at: new Date((job.scraped_at as any) * 1000).toISOString(),
      created_at: new Date((job.created_at as any) * 1000).toISOString(),
      updated_at: new Date((job.updated_at as any) * 1000).toISOString()
    }));

    return {
      data: formattedData,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit)
      },
      filters: this.getFilterOptions()
    };
  }

  public async getJobById(id: number): Promise<Job | null> {
    const query = `
      SELECT
        id, job_id, title, company, company_id, location, description,
        employment_type, seniority_level, industry,
        salary_min, salary_max, salary_currency,
        job_url, apply_url,
        posted_at, scraped_at, search_id,
        raw_data, page_html, created_at, updated_at
      FROM jobs
      WHERE id = ?
    `;

    const job = this.db.prepare(query).get(id) as Job | undefined;

    if (!job) {
      return null;
    }

    // Convert timestamps to ISO strings
    return {
      ...job,
      posted_at: new Date((job.posted_at as any) * 1000).toISOString(),
      scraped_at: new Date((job.scraped_at as any) * 1000).toISOString(),
      created_at: new Date((job.created_at as any) * 1000).toISOString(),
      updated_at: new Date((job.updated_at as any) * 1000).toISOString()
    };
  }

  public async getJobHTML(id: number): Promise<{ html: string; url: string } | null> {
    const query = `
      SELECT page_html, job_url
      FROM jobs
      WHERE id = ?
    `;

    const result = this.db.prepare(query).get(id) as { page_html: string | null; job_url: string } | undefined;

    if (!result || !result.page_html) {
      return null;
    }

    return {
      html: result.page_html,
      url: result.job_url
    };
  }

  public getFilterOptions(): FilterOptions {
    // Get unique companies with counts
    const companies = this.db.prepare(`
      SELECT company as value, COUNT(*) as count
      FROM jobs
      GROUP BY company
      ORDER BY count DESC
      LIMIT 100
    `).all() as Array<{ value: string; count: number }>;

    // Get unique locations with counts
    const locations = this.db.prepare(`
      SELECT location as value, COUNT(*) as count
      FROM jobs
      GROUP BY location
      ORDER BY count DESC
      LIMIT 100
    `).all() as Array<{ value: string; count: number }>;

    // Get employment types
    const employmentTypes = this.db.prepare(`
      SELECT employment_type as value, COUNT(*) as count
      FROM jobs
      WHERE employment_type IS NOT NULL
      GROUP BY employment_type
      ORDER BY count DESC
    `).all() as Array<{ value: string; count: number }>;

    // Get seniority levels
    const seniorityLevels = this.db.prepare(`
      SELECT seniority_level as value, COUNT(*) as count
      FROM jobs
      WHERE seniority_level IS NOT NULL
      GROUP BY seniority_level
      ORDER BY count DESC
    `).all() as Array<{ value: string; count: number }>;

    // Get industries
    const industries = this.db.prepare(`
      SELECT industry as value, COUNT(*) as count
      FROM jobs
      WHERE industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 100
    `).all() as Array<{ value: string; count: number }>;

    // Get salary range
    const salaryRange = this.db.prepare(`
      SELECT
        MIN(salary_min) as min,
        MAX(salary_max) as max
      FROM jobs
      WHERE salary_min IS NOT NULL OR salary_max IS NOT NULL
    `).get() as { min: number; max: number } | undefined;

    // Get date range
    const dateRange = this.db.prepare(`
      SELECT
        MIN(posted_at) as min,
        MAX(posted_at) as max
      FROM jobs
    `).get() as { min: number; max: number } | undefined;

    return {
      companies,
      locations,
      employmentTypes,
      seniorityLevels,
      industries,
      salaryRange: salaryRange || { min: 0, max: 0 },
      dateRange: {
        min: dateRange?.min ? new Date(dateRange.min * 1000).toISOString() : new Date().toISOString(),
        max: dateRange?.max ? new Date(dateRange.max * 1000).toISOString() : new Date().toISOString()
      }
    };
  }
}
