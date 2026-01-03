import { create } from 'zustand';

interface SelectionState {
  selectedJobIds: Set<string>;

  toggleSelection: (jobId: string) => void;
  selectAll: (jobIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (jobId: string) => boolean;
  getSelectedCount: () => number;
  getSelectedIds: () => string[];
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selectedJobIds: new Set<string>(),

  toggleSelection: (jobId: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedJobIds);
      if (newSelected.has(jobId)) {
        newSelected.delete(jobId);
      } else {
        newSelected.add(jobId);
      }
      return { selectedJobIds: newSelected };
    });
  },

  selectAll: (jobIds: string[]) => {
    set({ selectedJobIds: new Set(jobIds) });
  },

  clearSelection: () => {
    set({ selectedJobIds: new Set<string>() });
  },

  isSelected: (jobId: string) => {
    return get().selectedJobIds.has(jobId);
  },

  getSelectedCount: () => {
    return get().selectedJobIds.size;
  },

  getSelectedIds: () => {
    return Array.from(get().selectedJobIds);
  }
}));
