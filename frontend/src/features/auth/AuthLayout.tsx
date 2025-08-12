import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-teal-50 to-indigo-50">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <Link to="/" className="text-2xl font-bold">
            <span className="text-[var(--accent)]">Pulse</span> Finance
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
