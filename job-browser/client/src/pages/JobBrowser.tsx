import { useEffect } from 'react';
import { useJobs } from '../hooks/useJobs';
import { useFilterStore } from '../store/filterStore';
import { FilterPanel } from '../components/FilterPanel';
import { JobList } from '../components/JobList';

export function JobBrowser() {
  const {
    search,
    companies,
    locations,
    employmentTypes,
    seniorityLevels,
    industries,
    salaryMin,
    salaryMax,
    postedAfter,
    scrapedAfter,
    sortBy,
    sortOrder,
    page,
    setPage
  } = useFilterStore();

  const { data, isLoading, error } = useJobs({
    page,
    limit: 20,
    search: search || undefined,
    company: companies.length > 0 ? companies : undefined,
    location: locations.length > 0 ? locations : undefined,
    employmentType: employmentTypes.length > 0 ? employmentTypes : undefined,
    seniorityLevel: seniorityLevels.length > 0 ? seniorityLevels : undefined,
    industry: industries.length > 0 ? industries : undefined,
    salaryMin,
    salaryMax,
    postedAfter,
    scrapedAfter,
    sortBy,
    sortOrder
  });

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error loading jobs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Job Browser
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Browse and filter LinkedIn job postings
              </p>
            </div>
            {data && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {data.pagination.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Jobs
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="flex-shrink-0">
            {data?.filters && <FilterPanel filterOptions={data.filters} />}
          </aside>

          {/* Job List */}
          <main className="flex-1 min-w-0">
            <JobList
              jobs={data?.data || []}
              isLoading={isLoading}
              totalJobs={data?.pagination.total || 0}
              currentPage={data?.pagination.page || 1}
              totalPages={data?.pagination.totalPages || 1}
              onPageChange={setPage}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
