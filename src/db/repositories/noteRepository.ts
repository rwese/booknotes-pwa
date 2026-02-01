import { db, generateId } from '../schema'
import type { Note } from '../../types'

export const noteRepository = {
  async getAll(): Promise<Note[]> {
    return db.notes.toArray()
  },

  async getById(id: string): Promise<Note | undefined> {
    return db.notes.get(id)
  },

  async getByBookId(bookId: string): Promise<Note[]> {
    return db.notes.where('bookId').equals(bookId).toArray()
  },

  async create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = generateId()
    await db.notes.add({
      ...note,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return id
  },

  async update(id: string, updates: Partial<Note>): Promise<void> {
    await db.notes.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  },

  async delete(id: string): Promise<void> {
    await db.notes.delete(id)
  },

  async deleteByBookId(bookId: string): Promise<void> {
    const notes = await db.notes.where('bookId').equals(bookId).toArray()
    for (const note of notes) {
      await db.notes.delete(note.id)
    }
  }
}
