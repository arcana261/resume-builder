import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  search: string;
  companies: string[];
  locations: string[];
  employmentTypes: string[];
  seniorityLevels: string[];
  industries: string[];
  salaryMin?: number;
  salaryMax?: number;
  postedAfter?: string;
  scrapedAfter?: string;
  sortBy: 'posted_at' | 'scraped_at' | 'salary_min' | 'salary_max' | 'title';
  sortOrder: 'asc' | 'desc';
  page: number;

  setSearch: (search: string) => void;
  setCompanies: (companies: string[]) => void;
  setLocations: (locations: string[]) => void;
  setEmploymentTypes: (types: string[]) => void;
  setSeniorityLevels: (levels: string[]) => void;
  setIndustries: (industries: string[]) => void;
  setSalaryRange: (min?: number, max?: number) => void;
  setPostedAfter: (date?: string) => void;
  setScrapedAfter: (date?: string) => void;
  setSortBy: (sortBy: FilterState['sortBy']) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  clearAllFilters: () => void;
  getActiveFilterCount: () => number;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      search: '',
      companies: [],
      locations: [],
      employmentTypes: [],
      seniorityLevels: [],
      industries: [],
      salaryMin: undefined,
      salaryMax: undefined,
      postedAfter: undefined,
      scrapedAfter: undefined,
      sortBy: 'posted_at',
      sortOrder: 'desc',
      page: 1,

      setSearch: (search) => set({ search, page: 1 }),
      setCompanies: (companies) => set({ companies, page: 1 }),
      setLocations: (locations) => set({ locations, page: 1 }),
      setEmploymentTypes: (employmentTypes) => set({ employmentTypes, page: 1 }),
      setSeniorityLevels: (seniorityLevels) => set({ seniorityLevels, page: 1 }),
      setIndustries: (industries) => set({ industries, page: 1 }),
      setSalaryRange: (min, max) => set({ salaryMin: min, salaryMax: max, page: 1 }),
      setPostedAfter: (postedAfter) => set({ postedAfter, page: 1 }),
      setScrapedAfter: (scrapedAfter) => set({ scrapedAfter, page: 1 }),
      setSortBy: (sortBy) => set({ sortBy, page: 1 }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      setPage: (page) => set({ page }),

      clearAllFilters: () => set({
        search: '',
        companies: [],
        locations: [],
        employmentTypes: [],
        seniorityLevels: [],
        industries: [],
        salaryMin: undefined,
        salaryMax: undefined,
        postedAfter: undefined,
        scrapedAfter: undefined,
        page: 1
      }),

      getActiveFilterCount: () => {
        const state = get();
        let count = 0;
        if (state.search) count++;
        if (state.companies.length > 0) count += state.companies.length;
        if (state.locations.length > 0) count += state.locations.length;
        if (state.employmentTypes.length > 0) count += state.employmentTypes.length;
        if (state.seniorityLevels.length > 0) count += state.seniorityLevels.length;
        if (state.industries.length > 0) count += state.industries.length;
        if (state.salaryMin !== undefined) count++;
        if (state.salaryMax !== undefined) count++;
        if (state.postedAfter) count++;
        if (state.scrapedAfter) count++;
        return count;
      }
    }),
    {
      name: 'job-filters',
      partialize: (state) => ({
        search: state.search,
        companies: state.companies,
        locations: state.locations,
        employmentTypes: state.employmentTypes,
        seniorityLevels: state.seniorityLevels,
        industries: state.industries,
        salaryMin: state.salaryMin,
        salaryMax: state.salaryMax,
        postedAfter: state.postedAfter,
        scrapedAfter: state.scrapedAfter,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
);
