/**
 * Workspace Modal Store (Zustand)
 *
 * Manages modal state for workspace quick actions:
 * - Essay editor modal
 * - Document upload modal
 * - Recommendation request modal
 *
 * Story 3.8 AC#2: Quick action buttons with modal workflows
 *
 * @module stores/workspaceModalStore
 */

import { create } from 'zustand'

export type ModalType = 'essay' | 'document' | 'recommendation' | null

export interface ModalData {
  essayId?: string
  documentCategory?: string
  [key: string]: any
}

interface WorkspaceModalStore {
  /**
   * Currently active modal
   */
  activeModal: ModalType

  /**
   * Context data for the modal
   */
  modalData: ModalData | null

  /**
   * Open a modal with context data
   */
  openModal: (modal: ModalType, data?: ModalData) => void

  /**
   * Close the active modal
   */
  closeModal: () => void
}

/**
 * Workspace modal state store
 */
export const useWorkspaceModalStore = create<WorkspaceModalStore>((set) => ({
  activeModal: null,
  modalData: null,

  openModal: (modal, data) => {
    set({
      activeModal: modal,
      modalData: data,
    })
  },

  closeModal: () => {
    set({
      activeModal: null,
      modalData: null,
    })
  },
}))
