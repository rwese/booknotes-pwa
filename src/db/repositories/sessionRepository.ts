import { db, generateId } from '../schema'
import type { ReadingSession } from '../../types'

export const sessionRepository = {
  async getAll(): Promise<ReadingSession[]> {
    return db.readingSessions.toArray()
  },

  async getById(id: string): Promise<ReadingSession | undefined> {
    return db.readingSessions.get(id)
  },

  async getByBookId(bookId: string): Promise<ReadingSession[]> {
    return db.readingSessions
      .where('bookId')
      .equals(bookId)
      .sortBy('startDate')
  },

  async create(session: Omit<ReadingSession, 'id' | 'createdAt'>): Promise<string> {
    const id = generateId()
    await db.readingSessions.add({
      ...session,
      id,
      createdAt: new Date().toISOString()
    })
    return id
  },

  async update(id: string, updates: Partial<ReadingSession>): Promise<void> {
    await db.readingSessions.update(id, updates)
  },

  async delete(id: string): Promise<void> {
    await db.readingSessions.delete(id)
  },

  async getByDateRange(startDate: string, endDate: string): Promise<ReadingSession[]> {
    return db.readingSessions
      .filter((session: ReadingSession) => session.startDate >= startDate && session.startDate <= endDate)
      .toArray()
  },

  async getTotalPagesReadByBook(bookId: string): Promise<number> {
    const sessions = await this.getByBookId(bookId)
    return sessions.reduce((total, session) => total + session.pagesRead, 0)
  },

  async getActiveSession(bookId: string): Promise<ReadingSession | undefined> {
    return db.readingSessions
      .where('bookId')
      .equals(bookId)
      .filter((session: ReadingSession) => !session.endDate)
      .first()
  },

  async getStatistics(startDate?: string, endDate?: string) {
    let sessions: ReadingSession[]
    if (startDate && endDate) {
      sessions = await this.getByDateRange(startDate, endDate)
    } else {
      sessions = await db.readingSessions.toArray()
    }

    const byMonth: Record<string, { sessions: number; pages: number }> = {}

    sessions.forEach((session: ReadingSession) => {
      const month = session.startDate.substring(0, 7) // YYYY-MM
      if (!byMonth[month]) {
        byMonth[month] = { sessions: 0, pages: 0 }
      }
      byMonth[month].sessions++
      byMonth[month].pages += session.pagesRead
    })

    const totalSessions = sessions.length
    const totalPages = sessions.reduce((sum, s) => sum + s.pagesRead, 0)
    const totalTime = sessions.reduce((sum, s) => {
      if (s.endDate) {
        return sum + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime())
      }
      return sum
    }, 0)

    return {
      totalSessions,
      totalPages,
      totalTime,
      byMonth,
      averagePagesPerSession: totalSessions > 0 ? totalPages / totalSessions : 0
    }
  }
}
