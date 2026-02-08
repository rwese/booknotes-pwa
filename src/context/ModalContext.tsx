import { createContext, useState } from 'react'
import type { ReactNode } from 'react'

interface ModalContextType {
  isModalOpen: boolean
  setModalOpen: (isOpen: boolean) => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setModalOpen] = useState(false)

  return (
    <ModalContext.Provider value={{ isModalOpen, setModalOpen }}>
      {children}
    </ModalContext.Provider>
  )
}

export { ModalContext }