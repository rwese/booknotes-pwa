import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { bookRepository } from '../db/repositories/bookRepository'
import { sessionRepository } from '../db/repositories/sessionRepository'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export function AnalyticsPage() {
  const [bookStats, setBookStats] = useState<{
    booksByStatus: Record<string, number>
    genreCount: Record<string, number>
    averageRating: number
    totalBooks: number
  } | null>(null)
  const [readingStats, setReadingStats] = useState<{
    totalSessions: number
    totalPages: number
    byMonth: Record<string, { sessions: number; pages: number }>
    averagePagesPerSession: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      const [bookData, sessionData] = await Promise.all([
        bookRepository.getStatistics(),
        sessionRepository.getStatistics()
      ])
      setBookStats(bookData)
      setReadingStats(sessionData)
      setIsLoading(false)
    }
    loadStats()
  }, [])

  if (isLoading) {
    return <div style={{ padding: 20 }}>Loading analytics...</div>
  }

  if (!bookStats || !readingStats) {
    return <div style={{ padding: 20 }}>Failed to load analytics</div>
  }

  const statusLabels: Record<string, string> = {
    wantToRead: 'Want to Read',
    currentlyReading: 'Reading',
    read: 'Read'
  }

  // Status distribution chart
  const statusChartData = {
    labels: Object.keys(bookStats.booksByStatus)
      .filter(k => k !== 'total')
      .map(k => statusLabels[k] || k),
    datasets: [{
      data: Object.entries(bookStats.booksByStatus)
        .filter(([k]) => k !== 'total')
        .map(([_, v]) => v),
      backgroundColor: ['#64748b', '#3b82f6', '#22c55e'],
      borderWidth: 0
    }]
  }

  // Genre distribution chart
  const genreChartData = {
    labels: Object.keys(bookStats.genreCount),
    datasets: [{
      label: 'Books',
      data: Object.values(bookStats.genreCount),
      backgroundColor: '#0ea5e9'
    }]
  }

  // Reading sessions over time
  const months = Object.keys(readingStats.byMonth).sort().slice(-6)
  const readingChartData = {
    labels: months.map(m => {
      const [year, month] = m.split('-')
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' })
    }),
    datasets: [{
      label: 'Pages Read',
      data: months.map(m => readingStats.byMonth[m]?.pages || 0),
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }

  return (
    <div className="analytics-page" style={{ padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Analytics</h1>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--app-primary)' }}>{bookStats.totalBooks}</div>
          <div style={{ fontSize: 14, color: 'var(--app-text)', opacity: 0.6 }}>Total Books</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e' }}>{bookStats.booksByStatus.read}</div>
          <div style={{ fontSize: 14, color: 'var(--app-text)', opacity: 0.6 }}>Read</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6' }}>{readingStats.totalPages}</div>
          <div style={{ fontSize: 14, color: 'var(--app-text)', opacity: 0.6 }}>Pages Read</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Reading Status</h3>
          <div style={{ maxWidth: 200, margin: '0 auto' }}>
            <Doughnut data={statusChartData} />
          </div>
          <div style={{ marginTop: 12, fontSize: 14, textAlign: 'center' }}>
            {bookStats.averageRating > 0 && `Average Rating: ${bookStats.averageRating.toFixed(1)}/5`}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Books by Genre</h3>
          {Object.keys(bookStats.genreCount).length > 0 ? (
            <Bar data={genreChartData} />
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-text)', opacity: 0.6 }}>
              No genre data yet
            </div>
          )}
        </div>
      </div>

      {/* Reading Progress Chart */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Pages Read Over Time</h3>
        {months.length > 0 ? (
          <Line data={readingChartData} />
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--app-text)', opacity: 0.6 }}>
            Start logging reading sessions to see progress
          </div>
        )}
      </div>

      {/* Reading Stats */}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Reading Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{readingStats.totalSessions}</div>
            <div style={{ fontSize: 14, color: 'var(--app-text)', opacity: 0.6 }}>Total Sessions</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{readingStats.averagePagesPerSession.toFixed(1)}</div>
            <div style={{ fontSize: 14, color: 'var(--app-text)', opacity: 0.6 }}>Avg Pages/Session</div>
          </div>
        </div>
      </div>
    </div>
  )
}
