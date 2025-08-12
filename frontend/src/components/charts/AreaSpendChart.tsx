// src/components/charts/AreaSpendChart.tsx
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'

type Point = { date: string; income: number; expense: number }

const INCOME_COLOR = '#22c3a6'
const EXPENSE_COLOR = '#ef4444'

const isDark = () => document.documentElement.classList.contains('dark')

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Number(n || 0))

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const income = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0
  const expense = payload.find((p: any) => p.dataKey === 'expense')?.value ?? 0
  return (
    <div className="rounded-xl border border-token bg-surface px-3 py-2 text-sm shadow">
      <div className="text-dim mb-1">{label}</div>
      <div style={{ color: INCOME_COLOR }}>income : {inr(income)}</div>
      <div style={{ color: EXPENSE_COLOR }}>expense : {inr(expense)}</div>
    </div>
  )
}

export default function AreaSpendChart({ data }: { data: Point[] }) {
  const [dark, setDark] = useState(isDark())
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDark()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // keep dates sorted just in case
  const series = useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data]
  )

  const axis = dark ? '#aab4c4' : '#64748b'
  const grid = dark ? '#22314f' : '#e5e7eb'

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={series} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.28} />
            <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0.06} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.22} />
            <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={grid} strokeDasharray="3 3" />

        <XAxis
          dataKey="date"
          stroke={axis}
          tickMargin={6}
        />
        <YAxis
          stroke={axis}
          tickFormatter={(v) => `₹${inr(Number(v))}`}
          width={84}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* Expense above so the red marker is visible on hover */}
        <Area
          type="monotone"
          dataKey="expense"
          stroke={EXPENSE_COLOR}
          fill="url(#expenseFill)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke={INCOME_COLOR}
          fill="url(#incomeFill)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
