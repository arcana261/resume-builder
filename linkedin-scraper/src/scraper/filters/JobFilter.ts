import type { JobFilters } from '../../types/index.js';

export class JobFilter {
  /**
   * Build LinkedIn job search URL with filters
   */
  buildSearchUrl(filters: JobFilters): string {
    const baseUrl = 'https://www.linkedin.com/jobs/search';
    const params = new URLSearchParams();

    // Force English language interface (prevents translation prompts)
    params.append('trk', 'public_jobs_jobs-search-bar_search-submit');

    // Position keywords
    if (filters.position) {
      params.append('keywords', filters.position);
    }

    // Location
    if (filters.location) {
      params.append('location', filters.location);
    }

    // Experience level mapping
    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      const levels = this.mapExperienceLevels(filters.experienceLevel);
      if (levels.length > 0) {
        params.append('f_E', levels.join(','));
      }
    }

    // Employment type mapping
    if (filters.employmentType && filters.employmentType.length > 0) {
      const types = this.mapEmploymentTypes(filters.employmentType);
      if (types.length > 0) {
        params.append('f_JT', types.join(','));
      }
    }

    // Date posted
    if (filters.datePosted) {
      const dateCode = this.mapDatePosted(filters.datePosted);
      if (dateCode) {
        params.append('f_TPR', dateCode);
      }
    }

    // Remote option
    if (filters.remoteOption) {
      const remoteCode = this.mapRemoteOption(filters.remoteOption);
      if (remoteCode) {
        params.append('f_WT', remoteCode);
      }
    }

    // Salary (if available)
    if (filters.salary?.min) {
      params.append('f_SB2', filters.salary.min.toString());
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private mapExperienceLevels(levels: string[]): string[] {
    const mapping: Record<string, string> = {
      'Internship': '1',
      'Entry Level': '2',
      'Associate': '3',
      'Mid-Senior': '4',
      'Director': '5',
      'Executive': '6'
    };

    return levels
      .map(level => mapping[level])
      .filter((code): code is string => code !== undefined);
  }

  private mapEmploymentTypes(types: string[]): string[] {
    const mapping: Record<string, string> = {
      'Full-time': 'F',
      'Part-time': 'P',
      'Contract': 'C',
      'Temporary': 'T',
      'Volunteer': 'V',
      'Internship': 'I'
    };

    return types
      .map(type => mapping[type])
      .filter((code): code is string => code !== undefined);
  }

  private mapDatePosted(datePosted: string): string | null {
    const mapping: Record<string, string> = {
      'Past 24 hours': 'r86400',
      'Past Week': 'r604800',
      'Past Month': 'r2592000',
      'Any time': ''
    };

    return mapping[datePosted] || null;
  }

  private mapRemoteOption(option: string): string | null {
    const mapping: Record<string, string> = {
      'On-site': '1',
      'Remote': '2',
      'Hybrid': '3'
    };

    return mapping[option] || null;
  }
}
