import { useState, useEffect, useMemo } from 'react'
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

// SVG Icons
const BookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ReadingIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
)

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const TagsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

// Helper Components
function StatCard({ icon, value, label, colorClass }: { icon: React.ReactNode; value: number; label: string; colorClass: string }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  )
}

function ProgressCard({ value, label, unit }: { value: number | string; label: string; unit?: string }) {
  return (
    <div className="progress-card">
      <div className="progress-card__value">{value}</div>
      <div className="progress-card__label">{label}</div>
      {unit && <div className="progress-card__unit">{unit}</div>}
    </div>
  )
}

function ChartCard({ title, children, emptyMessage }: { title: string; children: React.ReactNode; emptyMessage?: string }) {
  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <h3 className="chart-card__title">{title}</h3>
      </div>
      <div className="chart-card__body">
        {children || <div className="chart-card__empty">{emptyMessage || 'No data available'}</div>}
      </div>
    </div>
  )
}

function RatingBarChart({ distribution }: { distribution: Record<number, number> }) {
  const maxCount = Math.max(...Object.values(distribution), 1)

  return (
    <div className="rating-chart">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0
        const percentage = (count / maxCount) * 100

        return (
          <div key={rating} className="rating-chart__row">
            <div className="rating-chart__stars">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`rating-chart__star ${i < rating ? '' : 'star empty'}`}
                />
              ))}
            </div>
            <div className="rating-chart__bar-container">
              <div className="rating-chart__bar" style={{ width: `${percentage}%` }} />
            </div>
            <div className="rating-chart__count">{count}</div>
          </div>
        )
      })}
    </div>
  )
}

function formatReadingTime(ms: number): string {
  if (!ms) return '0h 0m'
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

export function AnalyticsPage() {
  const [bookStats, setBookStats] = useState<{
    booksByStatus: Record<string, number>
    genreCount: Record<string, number>
    tagCount: Record<string, number>
    ratingDistribution: Record<number, number>
    averageRating: number
    totalBooks: number
  } | null>(null)
  const [readingStats, setReadingStats] = useState<{
    totalSessions: number
    totalPages: number
    totalTime: number
    byMonth: Record<string, { sessions: number; pages: number }>
    averagePagesPerSession: number
    readingSpeed: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        console.log('Loading analytics data...')
        const [bookData, sessionData] = await Promise.all([
          bookRepository.getStatistics(),
          sessionRepository.getStatistics()
        ])
        console.log('Book stats:', bookData)
        console.log('Session stats:', sessionData)
        setBookStats(bookData)
        setReadingStats(sessionData)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to load analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  // Top 10 tags - must be called before any early returns
  const topTags = useMemo(() => {
    if (!bookStats?.tagCount) return []
    return Object.entries(bookStats.tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  }, [bookStats?.tagCount])

  if (isLoading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-empty">
          <div className="analytics-empty__title">Error loading analytics</div>
          <p className="analytics-empty__description">{error}</p>
        </div>
      </div>
    )
  }

  if (!bookStats || !readingStats) {
    return (
      <div className="analytics-page">
        <div className="analytics-empty">
          <div className="analytics-empty__title">No data available</div>
          <p className="analytics-empty__description">Start adding books and logging reading sessions to see your analytics.</p>
        </div>
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    wantToRead: 'Want to Read',
    currentlyReading: 'Reading',
    read: 'Read'
  }

  const hasBooks = bookStats.totalBooks > 0
  const hasRatings = Object.values(bookStats.ratingDistribution).some(v => v > 0)
  const hasGenres = Object.keys(bookStats.genreCount).length > 0
  const hasMonths = Object.keys(readingStats.byMonth).length > 0

  // Status distribution chart
  const statusChartData = {
    labels: Object.entries(bookStats.booksByStatus)
      .filter(([k]) => k !== 'total' && k !== 'totalBooks')
      .map(([k, _]) => statusLabels[k] || k),
    datasets: [{
      data: Object.entries(bookStats.booksByStatus)
        .filter(([k]) => k !== 'total' && k !== 'totalBooks')
        .map(([_, v]) => v),
      backgroundColor: ['#a855f7', '#f97316', '#22c55e'],
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
    <div className="analytics-page">
      <header className="analytics-page__header">
        <h1 className="analytics-page__title">Reading Analytics</h1>
        <p className="analytics-page__subtitle">Track your reading journey</p>
      </header>

      {/* Overview Stats - 4 cards */}
      <div className="stats-grid">
        <StatCard
          icon={<BookIcon className="stat-card__icon" />}
          value={bookStats.totalBooks}
          label="Total Books"
          colorClass="stat-card--total"
        />
        <StatCard
          icon={<CheckIcon className="stat-card__icon" />}
          value={bookStats.booksByStatus.read || 0}
          label="Books Read"
          colorClass="stat-card--read"
        />
        <StatCard
          icon={<ReadingIcon className="stat-card__icon" />}
          value={bookStats.booksByStatus.currentlyReading || 0}
          label="Currently Reading"
          colorClass="stat-card--reading"
        />
        <StatCard
          icon={<TrendingUpIcon className="stat-card__icon" />}
          value={bookStats.booksByStatus.wantToRead || 0}
          label="Want to Read"
          colorClass="stat-card--want"
        />
      </div>

      {/* Reading Progress - 3 cards */}
      <div className="progress-grid">
        <ProgressCard
          value={readingStats.totalPages}
          label="Pages Read"
          unit="pages"
        />
        <ProgressCard
          value={formatReadingTime(readingStats.totalTime)}
          label="Reading Time"
        />
        <ProgressCard
          value={readingStats.readingSpeed.toFixed(1)}
          label="Avg Speed"
          unit="p/h"
        />
      </div>

      {/* Insights Section - Charts */}
      <section className="charts-section">
        <div className="charts-section__grid">
          {/* Rating Distribution */}
          <ChartCard title="Rating Distribution" emptyMessage="No rated books yet">
            {hasRatings ? <RatingBarChart distribution={bookStats.ratingDistribution} /> : null}
          </ChartCard>

          {/* Reading Status */}
          <ChartCard title="Reading Status" emptyMessage="No books yet">
            {hasBooks ? <Doughnut data={statusChartData} /> : null}
          </ChartCard>

          {/* Books by Genre */}
          <ChartCard title="Books by Genre" emptyMessage="No genre data yet">
            {hasGenres ? <Bar data={genreChartData} /> : null}
          </ChartCard>

          {/* Pages Over Time */}
          <ChartCard title="Pages Over Time" emptyMessage="Start logging sessions to see progress">
            {hasMonths ? <Line data={readingChartData} /> : null}
          </ChartCard>
        </div>
      </section>

      {/* Tag Analytics */}
      {topTags.length > 0 && (
        <div className="tag-analytics">
          <div className="tag-analytics__header">
            <TagsIcon className="tag-analytics__icon" />
            <h2 className="tag-analytics__title">Top Tags</h2>
          </div>
          <div className="tag-analytics__list">
            {topTags.map(([tag, count]) => (
              <span key={tag} className="tag-analytics__tag">
                {tag}
                <span className="tag-analytics__count">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
