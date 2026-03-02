'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { AssignHomeworkModal } from '@/components/worksheets/assign-homework-modal'

type AssignTab = 'worksheet' | 'resource' | 'template'

interface AssignModalOptions {
  clientId?: string
  worksheetId?: string
  tab?: AssignTab
}

interface AssignContextValue {
  openAssignModal: (options?: AssignModalOptions) => void
  closeAssignModal: () => void
}

const AssignContext = createContext<AssignContextValue>({
  openAssignModal: () => {},
  closeAssignModal: () => {},
})

export const useAssign = () => useContext(AssignContext)

export function AssignProvider({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [preSelectedClientId, setPreSelectedClientId] = useState<string | undefined>()
  const [preSelectedWorksheetId, setPreSelectedWorksheetId] = useState<string | undefined>()
  const [initialTab, setInitialTab] = useState<AssignTab>('worksheet')

  const openAssignModal = useCallback((options?: AssignModalOptions) => {
    setPreSelectedClientId(options?.clientId)
    setPreSelectedWorksheetId(options?.worksheetId)
    setInitialTab(options?.tab || 'worksheet')
    setModalOpen(true)
  }, [])

  const closeAssignModal = useCallback(() => {
    setModalOpen(false)
    setPreSelectedClientId(undefined)
    setPreSelectedWorksheetId(undefined)
    setInitialTab('worksheet')
  }, [])

  return (
    <AssignContext.Provider value={{ openAssignModal, closeAssignModal }}>
      {children}
      <AssignHomeworkModal
        open={modalOpen}
        onClose={closeAssignModal}
        preSelectedClientId={preSelectedClientId}
        preSelectedWorksheetId={preSelectedWorksheetId}
        initialTab={initialTab}
      />
    </AssignContext.Provider>
  )
}
