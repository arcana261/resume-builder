import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { formatSalary } from '../lib/utils';
import { SafeHTML } from './SafeHTML';
import { DeleteButton } from './DeleteButton';
import { useSelectionStore } from '../store/selectionStore';
import type { Job } from '@shared/types';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const navigate = useNavigate();
  const { isSelected, toggleSelection } = useSelectionStore();

  const selected = isSelected(job.job_id);

  const handleCardClick = () => {
    navigate(`/jobs/${job.id}`);
  };

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    toggleSelection(job.job_id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative bg-white dark:bg-gray-800 rounded-lg border ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-700'
      } p-6 hover:shadow-lg transition-all cursor-pointer group`}
    >
      {/* Checkbox */}
      <div className="absolute top-2 left-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          aria-label={`Select ${job.title}`}
        />
      </div>

      {/* Delete Button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DeleteButton
          jobId={job.job_id}
          jobTitles={[job.title]}
          variant="icon"
          size="sm"
        />
      </div>

      {/* Header */}
      <div className="mb-4 ml-7">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
          {job.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {job.employment_type && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {job.employment_type}
          </span>
        )}
        {job.seniority_level && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {job.seniority_level}
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{job.location}</span>
        </div>

        {(job.salary_min || job.salary_max) && (
          <div className="flex items-center gap-2 text-green-600">
            <DollarSign className="w-4 h-4" />
            <span>{formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Posted {formatDistanceToNow(new Date(job.posted_at), { addSuffix: true })}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Scraped {formatDistanceToNow(new Date(job.scraped_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Description Preview */}
      <div className="mb-4 line-clamp-3 overflow-hidden">
        <SafeHTML
          html={job.description.substring(0, 300)}
          className="text-sm [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:hidden [&_ol]:hidden"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          View Details
        </button>
        <a
          href={job.job_url.startsWith('http') ? job.job_url : `https://www.linkedin.com/jobs/view/${job.job_id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalClick}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
          title="Open in LinkedIn"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
