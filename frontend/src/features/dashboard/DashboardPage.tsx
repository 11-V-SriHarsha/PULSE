import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'
import SummaryCards from './SummaryCards'
import Card from '../../components/ui/Card'
import AreaSpendChart from '../../components/charts/AreaSpendChart'
import CategoryPieChart from '../../components/charts/CategoryPieChart'
import { fmtDate, inr } from '../../lib/format'

interface Txn {
  id: string
  description: string
  amount: number | string // Prisma Decimal may arrive as string
  type: 'INCOME' | 'EXPENSE'
  date: string
  category: string
}

type Preset = 'THIS_MONTH' | 'LAST_30' | 'LAST_90' | 'CUSTOM'

const asNum = (v: unknown) => (typeof v === 'number' ? v : Number(v))
const iso = (d: Date) => d.toISOString().slice(0, 10)
const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const lastOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0)

export default function DashboardPage() {
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number; netSavings: number }>()
  const [txns, setTxns] = useState<Txn[]>([])
  const [preset, setPreset] = useState<Preset>('THIS_MONTH')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const computeRange = (): { from?: string; to?: string } => {
    const now = new Date()
    if (preset === 'THIS_MONTH') return { from: iso(firstOfMonth(now)), to: iso(lastOfMonth(now)) }
    if (preset === 'LAST_30') {
      const to = iso(now)
      const from = iso(new Date(now.getTime() - 29 * 24 * 3600 * 1000))
      return { from, to }
    }
    if (preset === 'LAST_90') {
      const to = iso(now)
      const from = iso(new Date(now.getTime() - 89 * 24 * 3600 * 1000))
      return { from, to }
    }
    return { from: startDate || undefined, to: endDate || undefined }
  }

  const load = async () => {
    const { from, to } = computeRange()
    const params: Record<string, string> = {}
    if (from) params.startDate = from
    if (to) params.endDate = to
    const [s, t] = await Promise.all([
      api.get(API.TXNS_SUMMARY, { params }),
      api.get(API.TXNS, { params })
    ])
    setSummary(s.data)
    setTxns(t.data)
  }

  useEffect(() => { load() }, [preset])
  useEffect(() => { if (preset === 'CUSTOM') load() }, [startDate, endDate])

  // Income & Expense per day for the dual-series area chart
  const spendSeries = useMemo(() => {
    const map = new Map<string, { expense: number; income: number }>()
    txns.forEach(t => {
      const d = t.date.slice(0, 10)
      const amt = asNum(t.amount) || 0
      const cur = map.get(d) ?? { expense: 0, income: 0 }
      if (t.type === 'EXPENSE') cur.expense += amt
      else cur.income += amt
      map.set(d, cur)
    })
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [txns])

  // Combined (INCOME + EXPENSE) by category for the pie
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    txns.forEach(t => {
      const amt = asNum(t.amount) || 0
      map.set(t.category, (map.get(t.category) || 0) + amt)
    })
    const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value }))
    arr.sort((a, b) => b.value - a.value)
    const top = arr.slice(0, 8)
    const rest = arr.slice(8).reduce((s, x) => s + x.value, 0)
    return rest ? [...top, { name: 'Other', value: rest }] : top
  }, [txns])

  return (
    <div className="space-y-6">
      {/* Range controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex gap-2">
            {(['THIS_MONTH', 'LAST_30', 'LAST_90', 'CUSTOM'] as Preset[]).map(p => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-2 rounded-lg text-sm border ${preset === p ? 'bg-[var(--accent)] text-white border-transparent' : 'bg-white hover:bg-gray-50'
                  }`}
              >
                {p === 'THIS_MONTH' ? 'This Month' : p === 'LAST_30' ? 'Last 30 Days' : p === 'LAST_90' ? 'Last 90 Days' : 'Custom'}
              </button>
            ))}
          </div>

          {preset === 'CUSTOM' && (
            <div className="flex gap-3 md:ml-auto">
              <div>
                <div className="text-xs text-gray-500">Start</div>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
              </div>
              <div>
                <div className="text-xs text-gray-500">End</div>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
              </div>
            </div>
          )}
        </div>
      </Card>

      <SummaryCards data={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="font-medium mb-2">Income vs Expense Over Time</div>
          <AreaSpendChart data={spendSeries} />
        </Card>
        <Card className="p-4">
          <div className="font-medium mb-2">By Category</div>
          <CategoryPieChart data={byCategory} />
        </Card>
      </div>

      <Card className="p-4">
        <div className="font-medium mb-3 text-center">Recent Transactions</div>
        <div className="divide-y">
          {txns.slice(0, 10).map(t => {
            const amt = asNum(t.amount) || 0
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
          {txns.length === 0 && <div className="py-8 text-center text-gray-500 text-sm">No data for this range.</div>}
        </div>
      </Card>
    </div>
  )
}
