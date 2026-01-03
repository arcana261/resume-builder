import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobCount: number;
  jobTitles?: string[];
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  jobCount,
  jobTitles = [],
  isDeleting = false
}: DeleteConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const displayTitles = jobTitles.slice(0, 5);
  const remainingCount = jobTitles.length - displayTitles.length;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="delete-dialog-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h3
            id="delete-dialog-title"
            className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2"
          >
            Delete {jobCount === 1 ? 'Job' : 'Jobs'}?
          </h3>

          {/* Message */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
            <p className="mb-2">
              Are you sure you want to delete {jobCount === 1 ? 'this job' : `these ${jobCount} jobs`}?
              This action cannot be undone.
            </p>

            {displayTitles.length > 0 && (
              <div className="mt-4 text-left bg-gray-50 dark:bg-gray-900 rounded p-3 max-h-32 overflow-y-auto">
                <ul className="space-y-1 text-xs">
                  {displayTitles.map((title, index) => (
                    <li key={index} className="truncate">
                      • {title}
                    </li>
                  ))}
                  {remainingCount > 0 && (
                    <li className="text-gray-500 dark:text-gray-500">
                      • and {remainingCount} more...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
