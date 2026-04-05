import { createContext, useContext, useMemo, useState } from 'react'

const CrmModalContext = createContext(null)

export function CrmModalProvider({ children }) {
  const [modal, setModal] = useState(null)

  const value = useMemo(
    () => ({
      modal,
      openModal: (name, extra = {}) => setModal({ name, ...extra }),
      closeModal: () => setModal(null),
    }),
    [modal]
  )

  return <CrmModalContext.Provider value={value}>{children}</CrmModalContext.Provider>
}

export function useCrmModal() {
  const ctx = useContext(CrmModalContext)
  if (!ctx) {
    throw new Error('useCrmModal debe usarse dentro de CrmModalProvider')
  }
  return ctx
}
