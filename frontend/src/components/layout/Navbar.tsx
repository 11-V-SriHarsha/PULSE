// src/components/layout/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { authState } from '../../state/auth.atom'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'

export default function Navbar() {
  const auth = useRecoilValue(authState)
  const setAuth = useSetRecoilState(authState)
  const navigate = useNavigate()

  const logout = async () => {
    await api.post(API.LOGOUT)
    setAuth({ isAuthed: false, user: undefined })
    navigate('/auth/login')
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-xl font-bold">
          <span className="text-[var(--accent)]">Pulse</span> Finance
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {auth?.user && <span className="text-sm text-gray-600">Hi, {auth.user.name || 'User'}</span>}
        {auth?.isAuthed && (
          <button
            onClick={logout}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  )
}
