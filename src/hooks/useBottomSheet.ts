import { useContext } from 'react'
import { BottomSheetContext } from '../context/BottomSheetContext'

export function useBottomSheet() {
  const context = useContext(BottomSheetContext)
  if (!context) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider')
  }
  return context
}