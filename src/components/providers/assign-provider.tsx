'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { AssignWorksheetModal } from '@/components/worksheets/assign-worksheet-modal'

interface AssignContextValue {
  openAssignModal: (preSelectedClientId?: string, preSelectedWorksheetId?: string) => void
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

  const openAssignModal = useCallback(
    (clientId?: string, worksheetId?: string) => {
      setPreSelectedClientId(clientId)
      setPreSelectedWorksheetId(worksheetId)
      setModalOpen(true)
    },
    [],
  )

  const closeAssignModal = useCallback(() => {
    setModalOpen(false)
    setPreSelectedClientId(undefined)
    setPreSelectedWorksheetId(undefined)
  }, [])

  return (
    <AssignContext.Provider value={{ openAssignModal, closeAssignModal }}>
      {children}
      <AssignWorksheetModal
        open={modalOpen}
        onClose={closeAssignModal}
        preSelectedClientId={preSelectedClientId}
        preSelectedWorksheetId={preSelectedWorksheetId}
      />
    </AssignContext.Provider>
  )
}
