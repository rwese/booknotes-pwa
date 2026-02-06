import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookRepository } from '../db/repositories/bookRepository'
import type { Book, BookFilters } from '../types'

export function useBooks(filters?: BookFilters) {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: () => bookRepository.search(filters || {}),
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ['book', id],
    queryFn: () => bookRepository.getById(id),
    enabled: !!id,
    refetchOnWindowFocus: false
  })
}

export function useBookBySlug(slug: string) {
  return useQuery({
    queryKey: ['book', 'slug', slug],
    queryFn: () => bookRepository.getBySlug(slug),
    enabled: !!slug,
    refetchOnWindowFocus: false
  })
}

export function useAllBooks() {
  return useQuery({
    queryKey: ['books', 'all'],
    queryFn: () => bookRepository.getAll(),
    staleTime: 1000 * 60 * 5
  })
}

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: () => bookRepository.getGenres()
  })
}

export function useAllTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => bookRepository.getAllTags()
  })
}

export function useAuthors() {
  return useQuery({
    queryKey: ['authors'],
    queryFn: () => bookRepository.getAuthors()
  })
}

export function usePublishers() {
  return useQuery({
    queryKey: ['publishers'],
    queryFn: () => bookRepository.getPublishers()
  })
}

export function useLanguages() {
  return useQuery({
    queryKey: ['languages'],
    queryFn: () => bookRepository.getLanguages()
  })
}

export function useBookStatistics() {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: () => bookRepository.getStatistics()
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (book: Omit<Book, 'id' | 'slug' | 'createdAt' | 'updatedAt'>) =>
      bookRepository.create(book),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
    }
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Book> }) =>
      bookRepository.update(id, updates),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: ['books'] })
      await queryClient.invalidateQueries({ queryKey: ['book', id] })
      // Also invalidate by slug in case slug changed
      await queryClient.invalidateQueries({ queryKey: ['book', 'slug'] })
      await queryClient.invalidateQueries({ queryKey: ['statistics'] })
    }
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bookRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
    }
  })
}
