
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

type Item = { name: string; value: number }
export default function CategoryPieChart({ data }: { data: Item[] }) {
  const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#eab308', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#6b7280']
  const total = data.reduce((s, d) => s + (d.value || 0), 0)

  // Sort by value desc, keep top N, bucket rest as "Other"
  const MAX_SLICES = 6
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, MAX_SLICES)
  const restSum = sorted.slice(MAX_SLICES).reduce((s, x) => s + x.value, 0)
  const chartData = restSum ? [...top, { name: 'Other', value: restSum }] : top

  const percent = (v: number) => (total ? ((v / total) * 100).toFixed(2) : '0.0')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
      {/* Pie */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              labelLine={false}
              label={false} // <- avoid overlapping labels
              isAnimationActive={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any, _name: any, entry: any) => {
                const v = Number(val) || 0
                return [`₹${v.toFixed(2)} (${percent(v)}%)`, entry.payload.name]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with % */}
      <ul className="space-y-2">
        {chartData.map((it, i) => (
          <li key={it.name} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="inline-block h-3 w-3 rounded"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{it.name}</span>
            </div>
            <div className="tabular-nums text-gray-700">{percent(it.value)}%</div>
          </li>
        ))}
        {total === 0 && <li className="text-gray-500 text-sm">No data</li>}
      </ul>
    </div>
  )
}
