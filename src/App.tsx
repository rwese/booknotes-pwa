import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { UpdateBanner } from './components/UpdateBanner'
import { useVersionCheck } from './hooks/useVersionCheck'
import { BASE_PATH, navigateWithBasepath } from './utils/navigation'
import { BottomSheetProvider } from './context/BottomSheetContext'
import { useBottomSheet } from './hooks/useBottomSheet'

function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isBottomSheetOpen } = useBottomSheet()

  const isActive = (path: string) => {
    const fullPath = path === '/books' ? `${BASE_PATH}/books` : `${BASE_PATH}${path}`
    if (path === '/books') {
      return location.pathname.includes('/books')
    }
    return location.pathname === fullPath || location.pathname === `${fullPath}/`
  }

  const handleNavigate = (path: string) => {
    navigateWithBasepath(navigate, path)
  }

  return (
    <nav className={`tab-bar ${isBottomSheetOpen ? 'tab-bar--hidden' : ''}`}>
      <button
        onClick={() => handleNavigate('/books')}
        className={`tab-bar-item ${isActive('/books') ? 'active' : ''}`}
        aria-label="Books"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span>Books</span>
      </button>

      <button
        onClick={() => handleNavigate('/analytics')}
        className={`tab-bar-item ${isActive('/analytics') ? 'active' : ''}`}
        aria-label="Analytics"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
        <span>Analytics</span>
      </button>

      <button
        onClick={() => handleNavigate('/scanner')}
        className={`tab-bar-item ${isActive('/scanner') ? 'active' : ''}`}
        aria-label="Scan"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <line x1="7" y1="12" x2="17" y2="12" />
        </svg>
        <span>Scan</span>
      </button>

      <button
        onClick={() => handleNavigate('/settings')}
        className={`tab-bar-item ${isActive('/settings') ? 'active' : ''}`}
        aria-label="Settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span>Settings</span>
      </button>
    </nav>
  )
}

export default function App() {
  const { updateAvailable, newVersion, refresh, dismiss } = useVersionCheck()

  return (
    <BottomSheetProvider>
      <div className="app-shell">
        <main className="main-content">
          <Outlet />
        </main>
        {updateAvailable && (
          <UpdateBanner version={newVersion} onRefresh={refresh} onDismiss={dismiss} />
        )}
        <TabBar />
      </div>
    </BottomSheetProvider>
  )
}
