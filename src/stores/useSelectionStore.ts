/**
 * Story 3.9: Bulk Application Management
 * Selection state management using Zustand with localStorage persistence
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectionStore {
  // State
  selectedIds: Set<string>;

  // Actions
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getSelectedCount: () => number;
  getSelectedIds: () => string[];
}

export const useSelectionStore = create<SelectionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedIds: new Set<string>(),

      // Toggle single selection
      toggleSelection: (id: string) =>
        set((state) => {
          const newSelectedIds = new Set(state.selectedIds);
          if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
          } else {
            newSelectedIds.add(id);
          }
          return { selectedIds: newSelectedIds };
        }),

      // Select all from provided IDs
      selectAll: (ids: string[]) =>
        set(() => ({
          selectedIds: new Set(ids),
        })),

      // Clear all selections
      clearSelection: () =>
        set(() => ({
          selectedIds: new Set<string>(),
        })),

      // Check if ID is selected
      isSelected: (id: string) => {
        return get().selectedIds.has(id);
      },

      // Get count of selected items
      getSelectedCount: () => {
        return get().selectedIds.size;
      },

      // Get array of selected IDs
      getSelectedIds: () => {
        return Array.from(get().selectedIds);
      },
    }),
    {
      name: "application-selection-storage",
      // Custom serialization to handle Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              selectedIds: new Set(parsed.state.selectedIds),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              selectedIds: Array.from(value.state.selectedIds),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
