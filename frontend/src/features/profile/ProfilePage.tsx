import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { inr, fmtDate, setThemeClass } from '../../lib/format'
import { Link } from 'react-router-dom'

type Prefs = {
  dateFormat: 'DD-MM-YYYY' | 'YYYY-MM-DD'
  // advanced (kept but hidden by default)
  currency?: 'INR' | 'INR_COMMAS'
  weekStart?: 'SUN' | 'MON'
}
const defaultPrefs: Prefs = { dateFormat: 'DD-MM-YYYY' }

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



  const initials = useMemo(() => {
    const s = (user?.name || user?.email || 'U').trim()
    const parts = s.split(' ')
    return (parts[0]?.[0] || 'U').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
  }, [user])

  const updatePrefs = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    const next = { ...prefs, [k]: v }
    setPrefs(next)
    writePrefs(next)
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
      <Card className="p-8 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[var(--accent)] to-teal-600 text-white grid place-items-center text-2xl font-bold shadow-lg">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user?.name || 'Your Account'}
            </div>
            <div className="text-base text-gray-600 dark:text-gray-300 mb-2">
              {user?.email}
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Member since {user?.createdAt ? fmtDate(user.createdAt) : '—'}
            </div>
          </div>
        </div>
      </Card>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</div>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Income:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{inr(monthSummary?.totalIncome ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Expense:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{inr(monthSummary?.totalExpense ?? 0)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Net:</span>
                <span className={`font-bold text-lg ${(monthSummary?.netSavings ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {inr(monthSummary?.netSavings ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">This Year</div>
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Income:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{inr(yearSummary?.totalIncome ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Expense:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{inr(yearSummary?.totalExpense ?? 0)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Net:</span>
                <span className={`font-bold text-lg ${(yearSummary?.netSavings ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {inr(yearSummary?.netSavings ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Export Data</div>
            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="space-y-4">
            <Button 
              onClick={exportCsv} 
              disabled={exporting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5"
            >
              {exporting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing…
                </div>
              ) : (
                'Download CSV'
              )}
            </Button>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Exports all your transaction data in CSV format
            </div>
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

      {/* Preferences */}
      <Card className="p-6">
        <div className="font-medium mb-4">Preferences</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
