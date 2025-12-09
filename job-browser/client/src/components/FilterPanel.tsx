import { Search, X } from 'lucide-react';
import { useFilterStore } from '../store/filterStore';
import type { FilterOptions } from '@shared/types';

interface FilterPanelProps {
  filterOptions: FilterOptions;
}

export function FilterPanel({ filterOptions }: FilterPanelProps) {
  const {
    search,
    companies,
    locations,
    employmentTypes,
    seniorityLevels,
    scrapedAfter,
    setSearch,
    setCompanies,
    setLocations,
    setEmploymentTypes,
    setSeniorityLevels,
    setScrapedAfter,
    clearAllFilters,
    getActiveFilterCount
  } = useFilterStore();

  const activeCount = getActiveFilterCount();

  const toggleArrayFilter = (value: string, current: string[], setter: (values: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  return (
    <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters {activeCount > 0 && `(${activeCount})`}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Company Filter */}
      {filterOptions.companies.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company ({companies.length} selected)
          </label>
          <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
            {filterOptions.companies.slice(0, 20).map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={companies.includes(option.value)}
                  onChange={() => toggleArrayFilter(option.value, companies, setCompanies)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 flex-1">{option.value}</span>
                <span className="text-xs text-gray-500">({option.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Location Filter */}
      {filterOptions.locations.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location ({locations.length} selected)
          </label>
          <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
            {filterOptions.locations.slice(0, 20).map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={locations.includes(option.value)}
                  onChange={() => toggleArrayFilter(option.value, locations, setLocations)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 flex-1">{option.value}</span>
                <span className="text-xs text-gray-500">({option.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Employment Type */}
      {filterOptions.employmentTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Employment Type
          </label>
          <div className="space-y-2">
            {filterOptions.employmentTypes.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={employmentTypes.includes(option.value)}
                  onChange={() => toggleArrayFilter(option.value, employmentTypes, setEmploymentTypes)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{option.value} ({option.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Seniority Level */}
      {filterOptions.seniorityLevels.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seniority Level
          </label>
          <div className="space-y-2">
            {filterOptions.seniorityLevels.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seniorityLevels.includes(option.value)}
                  onChange={() => toggleArrayFilter(option.value, seniorityLevels, setSeniorityLevels)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{option.value} ({option.count})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Scraped Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Scraped Date
        </label>
        <div className="space-y-2">
          <button
            onClick={() => setScrapedAfter(undefined)}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              !scrapedAfter
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All time
          </button>
          <button
            onClick={() => {
              const date = new Date();
              date.setHours(date.getHours() - 24);
              setScrapedAfter(date.toISOString());
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              scrapedAfter && new Date(scrapedAfter) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Last 24 hours
          </button>
          <button
            onClick={() => {
              const date = new Date();
              date.setDate(date.getDate() - 7);
              setScrapedAfter(date.toISOString());
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              scrapedAfter && new Date(scrapedAfter) <= new Date(Date.now() - 24 * 60 * 60 * 1000) && new Date(scrapedAfter) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => {
              const date = new Date();
              date.setDate(date.getDate() - 30);
              setScrapedAfter(date.toISOString());
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              scrapedAfter && new Date(scrapedAfter) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Last 30 days
          </button>
        </div>
      </div>
    </div>
  );
}
