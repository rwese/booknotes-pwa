import { createContext, useState } from 'react'
import type { ReactNode } from 'react'

interface BottomSheetContextType {
  isBottomSheetOpen: boolean
  setBottomSheetOpen: (isOpen: boolean) => void
}

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(undefined)

export function BottomSheetProvider({ children }: { children: ReactNode }) {
  const [isBottomSheetOpen, setBottomSheetOpen] = useState(false)

  return (
    <BottomSheetContext.Provider value={{ isBottomSheetOpen, setBottomSheetOpen }}>
      {children}
    </BottomSheetContext.Provider>
  )
}

export { BottomSheetContext }