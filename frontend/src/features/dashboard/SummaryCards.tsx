import Card from '../../components/ui/Card'
import { inr } from '../../utils/format'

export default function SummaryCards({ data }: { data?: { totalIncome: number | string; totalExpense: number | string; netSavings: number | string } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="text-sm text-gray-500">Total Income</div>
        <div className="text-2xl font-semibold">{data ? inr(data.totalIncome) : '—'}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-gray-500">Total Expense</div>
        <div className="text-2xl font-semibold">{data ? inr(data.totalExpense) : '—'}</div>
      </Card>
      <Card className="p-4">
        <div className="text-sm text-gray-500">Net Savings</div>
        <div className="text-2xl font-semibold">{data ? inr(data.netSavings) : '—'}</div>
      </Card>
    </div>
  )
}
