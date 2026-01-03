import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ExternalLink, MapPin, Calendar, DollarSign, Download } from 'lucide-react';
import { useJob, useJobHTML } from '../hooks/useJobs';
import { formatSalary } from '../lib/utils';
import { SafeHTML } from '../components/SafeHTML';
import { DeleteButton } from '../components/DeleteButton';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'html' | 'raw'>('details');

  const { data: jobData, isLoading, error } = useJob(Number(id));
  const { data: htmlData } = useJobHTML(Number(id));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !jobData?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Job not found
          </h2>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to job list
          </button>
        </div>
      </div>
    );
  }

  const job = jobData.data;

  const downloadHTML = () => {
    if (!htmlData?.html) return;
    const blob = new Blob([htmlData.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${job.job_id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to jobs
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {job.title}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                {job.company}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
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

                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>Scraped {formatDistanceToNow(new Date(job.scraped_at), { addSuffix: true })}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {job.employment_type && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {job.employment_type}
                  </span>
                )}
                {job.seniority_level && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {job.seniority_level}
                  </span>
                )}
                {job.industry && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {job.industry}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={(job.apply_url || job.job_url).startsWith('http')
                  ? (job.apply_url || job.job_url)
                  : `https://www.linkedin.com/jobs/view/${job.job_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply on LinkedIn
                <ExternalLink className="w-4 h-4" />
              </a>
              <DeleteButton
                jobId={job.job_id}
                jobTitles={[job.title]}
                onSuccess={() => navigate('/')}
                variant="icon-text"
                size="md"
                className="w-full justify-center"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Job Details
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'html'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Original HTML
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'raw'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Raw Data
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          {activeTab === 'details' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Job Description
              </h2>
              <SafeHTML html={job.description} />
            </div>
          )}

          {activeTab === 'html' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Original LinkedIn Page
                </h2>
                {htmlData?.html && (
                  <button
                    onClick={downloadHTML}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4" />
                    Download HTML
                  </button>
                )}
              </div>

              {htmlData?.html ? (
                <div>
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This is the original LinkedIn page HTML. Some features may not work as expected.
                    </p>
                  </div>
                  <iframe
                    srcDoc={htmlData.html}
                    sandbox="allow-same-origin"
                    className="w-full h-[800px] border border-gray-300 rounded-md"
                    title="Job HTML Preview"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No HTML available for this job
                </div>
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Raw Job Data
              </h2>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                {JSON.stringify(JSON.parse(job.raw_data), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
