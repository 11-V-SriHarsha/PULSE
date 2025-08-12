import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'
import { useState } from 'react'

export default function ImportHubPage() {
  const [msg, setMsg] = useState<string>()
  const [loading, setLoading] = useState(false)

  const linkAA = async () => {
    setLoading(true)
    setMsg(undefined)
    try {
      const r = await api.get(API.AA_FETCH)
      setMsg(r.data?.message ?? 'Linked and imported from AA mock.')
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Failed to import AA data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4">
        <div className="font-medium mb-2">Link Bank (AA Mock)</div>
        <p className="text-sm text-gray-600 mb-3">Simulate Account Aggregator consent and fetch transactions.</p>
        <Button onClick={linkAA} disabled={loading}>
          {loading ? 'Importing...' : 'Import from AA (Mock)'}
        </Button>
        {msg && (
          <div className={`mt-3 text-sm p-2 rounded-lg ${
            msg.includes('Failed') || msg.includes('error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {msg}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="font-medium mb-2">Upload PDF Statement (Coming soon)</div>
        <p className="text-sm text-gray-600">Drop a PDF bank statement to parse securely on the server.</p>
      </Card>

      <Card className="p-4">
        <div className="font-medium mb-2">Connect Email (Coming soon)</div>
        <p className="text-sm text-gray-600">Read-only access to parse monthly statements or alerts.</p>
      </Card>

      <Card className="p-4">
        <div className="font-medium mb-2">Paste Grid (No CSV)</div>
        <p className="text-sm text-gray-600 mb-3">Paste rows as Date, Description, Amount; we’ll convert to JSON and send.</p>
        <textarea className="w-full h-32 rounded-xl border p-2 text-sm" placeholder="2025-08-10, ZOMATO ORDER, -450.50&#10;2025-08-09, SALARY CREDIT, 75000.00"></textarea>
        <div className="text-xs text-gray-500 mt-2">Submit feature coming later.</div>
      </Card>
    </div>
  )
}
