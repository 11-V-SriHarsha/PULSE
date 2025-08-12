import { Outlet, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getTheme, setThemeClass } from '../../lib/format'

export default function AuthLayout() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme())

  // Ensure theme is applied on auth pages
  useEffect(() => {
    setThemeClass()
  }, [])

  const onToggleTheme = () => {
    // Toggle theme logic
    const currentTheme = getTheme()
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    
    // Update localStorage
    const prefs = JSON.parse(localStorage.getItem('pulse:prefs') || '{}')
    prefs.theme = newTheme
    localStorage.setItem('pulse:prefs', JSON.stringify(prefs))
    
    // Update DOM
    setThemeClass()
    setTheme(newTheme)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 relative">
      {/* Theme toggle button - positioned in top right */}
      <button
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        className="absolute top-6 right-6 h-10 w-10 grid place-items-center rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm transition-colors"
      >
        {theme === 'dark' ? (
          // Sun icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M22 12h-2M4 12H2M19.07 4.93l1.42-1.42M3.51 20.49l1.42-1.42M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          // Moon icon
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white">
            <span className="text-[var(--accent)]">Pulse</span> Finance
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
