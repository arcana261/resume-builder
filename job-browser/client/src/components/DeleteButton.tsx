import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useDeleteJob, useDeleteBulkJobs } from '../hooks/useJobs';

interface DeleteButtonProps {
  jobId?: string;
  jobIds?: string[];
  jobTitles?: string[];
  onSuccess?: () => void;
  variant?: 'icon' | 'text' | 'icon-text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DeleteButton({
  jobId,
  jobIds,
  jobTitles = [],
  onSuccess,
  variant = 'icon',
  size = 'md',
  className = ''
}: DeleteButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const deleteJobMutation = useDeleteJob();
  const deleteBulkJobsMutation = useDeleteBulkJobs();

  const isBulk = !!jobIds && jobIds.length > 0;
  const jobCount = isBulk ? jobIds.length : 1;
  const isDeleting = deleteJobMutation.isPending || deleteBulkJobsMutation.isPending;

  const handleDelete = async () => {
    try {
      if (isBulk && jobIds) {
        const result = await deleteBulkJobsMutation.mutateAsync(jobIds);
        if (result.deleted > 0) {
          alert(`Successfully deleted ${result.deleted} job(s)${result.failed.length > 0 ? `. ${result.failed.length} failed.` : ''}`);
        }
      } else if (jobId) {
        await deleteJobMutation.mutateAsync(jobId);
        alert('Job deleted successfully');
      }

      setShowDialog(false);
      onSuccess?.();
    } catch (error: any) {
      alert(`Failed to delete: ${error.response?.data?.error || error.message}`);
    }
  };

  const sizeClasses = {
    sm: 'p-1 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const defaultColorClasses = 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20';

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDialog(true);
        }}
        disabled={isDeleting || (!jobId && !isBulk)}
        className={`${baseClasses} ${sizeClasses[size]} ${className || defaultColorClasses}`}
        aria-label={isBulk ? `Delete ${jobCount} jobs` : 'Delete job'}
        title={isBulk ? `Delete ${jobCount} jobs` : 'Delete job'}
      >
        {(variant === 'icon' || variant === 'icon-text') && (
          <Trash2 className={iconSizeClasses[size]} />
        )}
        {(variant === 'text' || variant === 'icon-text') && (
          <span>Delete</span>
        )}
      </button>

      <DeleteConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleDelete}
        jobCount={jobCount}
        jobTitles={jobTitles}
        isDeleting={isDeleting}
      />
    </>
  );
}
