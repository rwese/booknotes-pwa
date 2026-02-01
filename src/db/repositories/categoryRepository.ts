import { db, generateId } from '../schema'
import type { BookCategory } from '../../types'

export const categoryRepository = {
  async getAll(): Promise<BookCategory[]> {
    return db.categories.toArray()
  },

  async getById(id: string): Promise<BookCategory | undefined> {
    return db.categories.get(id)
  },

  async getByBookId(bookId: string): Promise<BookCategory[]> {
    return db.categories.filter((cat: BookCategory) => cat.bookIds.includes(bookId)).toArray()
  },

  async create(category: Omit<BookCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = generateId()
    await db.categories.add({
      ...category,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return id
  },

  async update(id: string, updates: Partial<BookCategory>): Promise<void> {
    await db.categories.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  },

  async delete(id: string): Promise<void> {
    await db.categories.delete(id)
  },

  async addBookToCategory(categoryId: string, bookId: string): Promise<void> {
    const category = await db.categories.get(categoryId)
    if (category && !category.bookIds.includes(bookId)) {
      await db.categories.update(categoryId, {
        bookIds: [...category.bookIds, bookId]
      })
    }
  },

  async removeBookFromCategory(categoryId: string, bookId: string): Promise<void> {
    const category = await db.categories.get(categoryId)
    if (category) {
      await db.categories.update(categoryId, {
        bookIds: category.bookIds.filter((bid: string) => bid !== bookId)
      })
    }
  },

  async getRootCategories(): Promise<BookCategory[]> {
    return db.categories.filter((cat: BookCategory) => !cat.parentId).toArray()
  },

  async getChildCategories(parentId: string): Promise<BookCategory[]> {
    return db.categories.where('parentId').equals(parentId).toArray()
  },

  async getCategoryTree(): Promise<BookCategory[]> {
    return db.categories.toArray()
  }
}
