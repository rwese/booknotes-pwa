import { useQuery } from '@tanstack/react-query'
import { isbnService } from '../services/isbnService'
import type { ISBNLookupResult } from '../types'

export function useISBNLookup(isbn: string | null) {
  return useQuery({
    queryKey: ['isbn', isbn],
    queryFn: async (): Promise<ISBNLookupResult> => {
      if (!isbn) throw new Error('ISBN is required')
      return isbnService.lookup(isbn)
    },
    enabled: !!isbn && isbn.length >= 10,
    staleTime: 1000 * 60 * 60 * 24 * 7, // Cache 7 days
    gcTime: 1000 * 60 * 60 * 24 * 30,   // Keep 30 days
    retry: 1
  })
}

export function useValidateISBN(isbn: string | null) {
  return useQuery({
    queryKey: ['validateISBN', isbn],
    queryFn: () => {
      if (!isbn) return false
      return isbnService.validateISBN(isbn)
    },
    enabled: !!isbn
  })
}
