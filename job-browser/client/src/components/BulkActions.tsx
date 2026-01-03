import { X } from 'lucide-react';
import { DeleteButton } from './DeleteButton';

interface BulkActionsProps {
  selectedCount: number;
  selectedIds: string[];
  selectedTitles: string[];
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  selectedIds,
  selectedTitles,
  onClearSelection
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white shadow-lg border-t border-blue-700 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold">
              {selectedCount} job{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onClearSelection}
              className="text-sm text-blue-100 hover:text-white underline"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-3">
            <DeleteButton
              jobIds={selectedIds}
              jobTitles={selectedTitles}
              onSuccess={onClearSelection}
              variant="icon-text"
              size="md"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            />
            <button
              onClick={onClearSelection}
              className="p-2 hover:bg-blue-700 rounded-md transition-colors"
              aria-label="Close bulk actions"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
