export interface Job {
    id: number;
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
    posted_at: string;
    scraped_at: string;
    search_id: number;
    raw_data: string;
    page_html?: string;
    created_at: string;
    updated_at: string;
}
export interface Search {
    id: number;
    query: string;
    location: string;
    filters: string;
    total_results: number;
    successful_scrapes: number;
    failed_scrapes: number;
    started_at: string;
    completed_at?: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
}
export interface JobsQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    company?: string[];
    location?: string[];
    employmentType?: string[];
    seniorityLevel?: string[];
    industry?: string[];
    salaryMin?: number;
    salaryMax?: number;
    postedAfter?: string;
    scrapedAfter?: string;
    sortBy?: 'posted_at' | 'scraped_at' | 'salary_min' | 'salary_max' | 'title';
    sortOrder?: 'asc' | 'desc';
}
export interface FilterOption {
    value: string;
    count: number;
}
export interface FilterOptions {
    companies: FilterOption[];
    locations: FilterOption[];
    employmentTypes: FilterOption[];
    seniorityLevels: FilterOption[];
    industries: FilterOption[];
    salaryRange: {
        min: number;
        max: number;
    };
    dateRange: {
        min: string;
        max: string;
    };
}
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface JobsResponse {
    data: Job[];
    pagination: Pagination;
    filters: FilterOptions;
}
export interface JobDetailResponse {
    data: Job;
}
export interface JobHTMLResponse {
    html: string;
    url: string;
}
export interface SearchesResponse {
    data: Search[];
}
export interface StatsResponse {
    total: number;
    byEmploymentType: Record<string, number>;
    bySeniorityLevel: Record<string, number>;
    byIndustry: Record<string, number>;
    averageSalary: number;
    recentlyAdded: number;
}
//# sourceMappingURL=types.d.ts.map