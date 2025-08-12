import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { inr, fmtDate, setThemeClass } from '../../lib/format'
import { Link } from 'react-router-dom'

type Prefs = {
  theme: 'light' | 'dark'
  dateFormat: 'DD-MM-YYYY' | 'YYYY-MM-DD'
  // advanced (kept but hidden by default)
  currency?: 'INR' | 'INR_COMMAS'
  weekStart?: 'SUN' | 'MON'
}
const defaultPrefs: Prefs = { theme: 'light', dateFormat: 'DD-MM-YYYY' }

const readPrefs = (): Prefs => {
  try { return { ...defaultPrefs, ...(JSON.parse(localStorage.getItem('pulse:prefs') || '{}')) } }
  catch { return defaultPrefs }
}
const writePrefs = (p: Prefs) => localStorage.setItem('pulse:prefs', JSON.stringify(p))

interface Txn {
  id: string
  description: string
  amount: number | string
  type: 'INCOME' | 'EXPENSE'
  date: string
  category: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [prefs, setPrefs] = useState<Prefs>(readPrefs())
  const [monthSummary, setMonthSummary] = useState<{ totalIncome: number; totalExpense: number; netSavings: number }>()
  const [yearSummary, setYearSummary] = useState<{ totalIncome: number; totalExpense: number; netSavings: number }>()
  const [recent, setRecent] = useState<Txn[]>([])
  const [exporting, setExporting] = useState(false)

  // Edit name
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<string | null>(null)

  // Change password
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<string | null>(null)

  // Advanced prefs reveal
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Apply theme before paint
  useEffect(() => { setThemeClass() }, [])

  // load profile + glance data
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const profile = await api.get(API.PROFILE)
      if (!mounted) return
      setUser(profile.data)
      setName(profile.data?.name ?? '')

      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10)
      const lastOfMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10)
      const firstOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0,10)
      const lastOfYear = new Date(now.getFullYear(), 11, 31).toISOString().slice(0,10)

      const [ms, ys, tx] = await Promise.all([
        api.get(API.TXNS_SUMMARY, { params: { startDate: firstOfMonth, endDate: lastOfMonth } }),
        api.get(API.TXNS_SUMMARY, { params: { startDate: firstOfYear, endDate: lastOfYear } }),
        api.get<Txn[]>(API.TXNS)
      ])
      if (!mounted) return
      setMonthSummary(ms.data)
      setYearSummary(ys.data)
      setRecent(tx.data.slice(0, 5))
    })()
    return () => { mounted = false }
  }, [])

  // apply theme when changed
  useEffect(() => { setThemeClass() }, [prefs.theme])

  const initials = useMemo(() => {
    const s = (user?.name || user?.email || 'U').trim()
    const parts = s.split(' ')
    return (parts[0]?.[0] || 'U').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
  }, [user])

  const updatePrefs = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    const next = { ...prefs, [k]: v }
    setPrefs(next)
    writePrefs(next)
    if (k === 'theme') setThemeClass()
  }

  const exportCsv = async () => {
    try {
      setExporting(true)
      const r = await api.get<Txn[]>(API.TXNS)
      const rows = r.data
      const header = ['Date','Description','Category','Type','Amount']
      const toCsv = (s: string) => `"${s.replace(/"/g, '""')}"`
      const csvLines = [header.join(',')]
      rows.forEach(t => {
        const date = fmtDate(t.date)
        const amount = typeof t.amount === 'number' ? t.amount : Number(t.amount)
        csvLines.push([date, t.description, t.category, t.type, amount.toFixed(2)].map(toCsv).join(','))
      })
      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pulse-transactions-${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingName(true)
    setNameMsg(null)
    try {
      await api.patch(API.UPDATE_PROFILE, { name })
      setNameMsg('Name updated ✔')
      setUser((u: any) => ({ ...u, name }))
      setTimeout(() => setNameMsg(null), 2500)
    } catch (err: any) {
      setNameMsg(err?.response?.data?.message || 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (newPw.length < 8) { setPwMsg('New password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { setPwMsg('New password and confirmation do not match'); return }
    setChangingPw(true)
    try {
      await api.post(API.CHANGE_PASSWORD, { currentPassword: currentPw, newPassword: newPw })
      setPwMsg('Password changed ✔')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwMsg(null), 2500)
    } catch (err: any) {
      setPwMsg(err?.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPw(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[var(--accent)] text-white grid place-items-center text-xl font-bold">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">{user?.name || 'Your Account'}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
          </div>
          <div className="text-sm text-gray-500">
            Member since <span className="font-medium">{user?.createdAt ? fmtDate(user.createdAt) : '—'}</span>
          </div>
        </div>
      </Card>

      {/* At-a-glance + Export */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-gray-500">This Month</div>
          <div className="mt-2 space-y-1 text-sm">
            <div>Income: <span className="font-semibold">{inr(monthSummary?.totalIncome ?? 0)}</span></div>
            <div>Expense: <span className="font-semibold">{inr(monthSummary?.totalExpense ?? 0)}</span></div>
            <div>Net: <span className="font-semibold">{inr(monthSummary?.netSavings ?? 0)}</span></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">This Year</div>
          <div className="mt-2 space-y-1 text-sm">
            <div>Income: <span className="font-semibold">{inr(yearSummary?.totalIncome ?? 0)}</span></div>
            <div>Expense: <span className="font-semibold">{inr(yearSummary?.totalExpense ?? 0)}</span></div>
            <div>Net: <span className="font-semibold">{inr(yearSummary?.netSavings ?? 0)}</span></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-gray-500">Export</div>
          <div className="mt-2">
            <Button onClick={exportCsv} disabled={exporting}>
              {exporting ? 'Preparing…' : 'Download CSV'}
            </Button>
            <div className="mt-2 text-xs text-gray-500">Exports all your transactions.</div>
          </div>
        </Card>
      </div>

      {/* Account (Edit name) + Security (Change password) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="font-medium mb-3">Account</div>
          <form onSubmit={saveName} className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Display name</div>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="text-xs text-gray-500">Email (read-only)</div>
            <div className="rounded-xl border px-3 py-2 text-sm bg-gray-50">{user?.email}</div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={savingName}>{savingName ? 'Saving…' : 'Save changes'}</Button>
              {nameMsg && <span className="text-sm text-gray-500">{nameMsg}</span>}
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <div className="font-medium mb-3">Security</div>
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Current password</div>
              <input type="password" className="w-full rounded-xl border px-3 py-2 text-sm"
                value={currentPw} onChange={(e)=>setCurrentPw(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">New password</div>
                <input type="password" className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={newPw} onChange={(e)=>setNewPw(e.target.value)} />
                <div className="text-[11px] text-gray-500 mt-1">Min 8 characters.</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Confirm new password</div>
                <input type="password" className="w-full rounded-xl border px-3 py-2 text-sm"
                  value={confirmPw} onChange={(e)=>setConfirmPw(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={changingPw}>{changingPw ? 'Updating…' : 'Change password'}</Button>
              {pwMsg && <span className="text-sm text-gray-500">{pwMsg}</span>}
            </div>
          </form>
        </Card>
      </div>

      {/* Preferences (trimmed) */}
      <Card className="p-6">
        <div className="font-medium mb-4">Preferences</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Theme */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Theme</div>
            <div className="flex gap-2">
              <button
                className={`px-3 py-2 rounded-lg text-sm border ${prefs.theme==='light'?'bg-[var(--accent)] text-white border-transparent':'bg-white hover:bg-gray-50'}`}
                onClick={() => updatePrefs('theme','light')}
                type="button"
              >Light</button>
              <button
                className={`px-3 py-2 rounded-lg text-sm border ${prefs.theme==='dark'?'bg-[var(--accent)] text-white border-transparent':'bg-white hover:bg-gray-50'}`}
                onClick={() => updatePrefs('theme','dark')}
                type="button"
              >Dark</button>
            </div>
          </div>

          {/* Date format */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Date format</div>
            <select
              value={prefs.dateFormat}
              onChange={e => updatePrefs('dateFormat', e.target.value as Prefs['dateFormat'])}
              className="rounded-xl border bg-white px-3 py-2 text-sm"
            >
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
            <div className="text-[11px] text-gray-500 mt-1">
              Preview: <span className="font-medium">{fmtDate(new Date())}</span>
            </div>
          </div>
        </div>

        {/* Advanced (optional) */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            {showAdvanced ? 'Hide' : 'Show'} advanced
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Currency format</div>
                <select
                  value={prefs.currency || 'INR_COMMAS'}
                  onChange={e => updatePrefs('currency', e.target.value as any)}
                  className="rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  <option value="INR_COMMAS">₹ + Indian commas (₹1,23,456.00)</option>
                  <option value="INR">Intl currency (₹ 1,23,456.00)</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Week starts on</div>
                <select
                  value={prefs.weekStart || 'MON'}
                  onChange={e => updatePrefs('weekStart', e.target.value as any)}
                  className="rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  <option value="MON">Monday</option>
                  <option value="SUN">Sunday</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recent 5 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Recent Transactions</div>
          <Link to="/transactions" className="text-sm text-[var(--accent)] hover:underline">View all</Link>
        </div>
        <div className="divide-y">
          {recent.map(t => {
            const amt = typeof t.amount === 'number' ? t.amount : Number(t.amount)
            return (
              <div key={t.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.description}</div>
                  <div className="text-xs text-gray-500">{fmtDate(t.date)} · {t.category}</div>
                </div>
                <div className={t.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}>
                  {t.type === 'EXPENSE' ? '-' : '+'}{inr(amt)}
                </div>
              </div>
            )
          })}
          {recent.length === 0 && <div className="py-6 text-center text-gray-500 text-sm">No transactions yet.</div>}
        </div>
      </Card>
    </div>
  )
}
