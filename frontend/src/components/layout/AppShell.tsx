import { Outlet, NavLink, Link } from 'react-router-dom'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { authState } from '../../state/auth.atom'
import Button from '../ui/Button'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'
import { useEffect } from 'react'

function cx(...x: Array<string | false | undefined>) {
  return x.filter(Boolean).join(' ')
}

export default function AppShell() {
  const auth = useRecoilValue(authState)
  const setAuth = useSetRecoilState(authState)

  // hydrate auth on refresh (cookie session)
  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const { data } = await api.get(API.PROFILE)
          if (mounted) setAuth({ isAuthed: true, user: data })
        } catch { /* not logged in */ }
      })()
    return () => { mounted = false }
  }, [setAuth])

  const onLogout = async () => {
    await api.post(API.LOGOUT)
    setAuth({ isAuthed: false, user: undefined })
    location.assign('/auth/login')
  }

  const user = auth.user
  const initials = (() => {
    const s = (user?.name || user?.email || 'U').trim()
    const p = s.split(' ')
    return (p[0]?.[0] || 'U').toUpperCase() + (p[1]?.[0] || '').toUpperCase()
  })()

  return (
    <div className="min-h-screen grid grid-cols-[16rem_1fr] bg-app">
      {/* Sidebar */}
      <aside className="sidebar border-r p-4">
        <Link to="/dashboard" className="block text-xl font-semibold mb-6">
          <span className="text-[var(--accent)]">Pulse</span> Finance
        </Link>

        <nav className="space-y-1">
          {[
            ['Dashboard', '/dashboard'],
            ['Transactions', '/transactions'],
            ['Import', '/import'],
            ['Make Payment', '/payments/make'],
            ['Payment History', '/payments/history'],
            ['Profile', '/profile'],
          ].map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cx(
                  'block rounded-xl px-3 py-2 text-sm',
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-body hover:bg-surface-2'
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="min-h-screen">
        {/* Topbar */}
        <header className="topbar sticky top-0 z-30 border-b">
          <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
            <div />
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-sm text-dim">
                Hi, <span className="font-medium">{user?.name || 'User'}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-[var(--accent)] text-white grid place-items-center text-xs font-bold">
                {initials}
              </div>
              <Button onClick={onLogout}>Logout</Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto max-w-6xl p-6">
          {/* we keep a subtle elevated wrapper on blank pages */}
          <Outlet />
        </div>
      </main>
    </div>
  )
}
