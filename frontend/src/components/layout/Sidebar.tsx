import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/import', label: 'Import' },
  { to: '/payments/make', label: 'Make Payment' },
  { to: '/payments/history', label: 'Payment History' },
  { to: '/profile', label: 'Profile' }
]

export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-gray-200 bg-white">
      <nav className="p-3 space-y-1">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-[var(--accent)] text-white' : 'hover:bg-gray-50'}`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
