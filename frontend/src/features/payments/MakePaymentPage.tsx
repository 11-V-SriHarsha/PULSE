import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useState } from 'react'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'

export default function MakePaymentPage() {
  const [amount, setAmount] = useState('')

  const pay = async () => {
    // Placeholder—when backend /api/payments exists, call with token + amount.
    // For demo, just show a toast-like message.
    alert('In production, this mounts PSP Elements (Stripe/Razorpay), tokenizes, then POSTs /api/payments.')
  }

  return (
    <Card className="p-4 max-w-lg">
      <div className="font-medium mb-2">Make a Payment</div>
      <div className="space-y-3">
        <Input placeholder="Amount (INR)" value={amount} onChange={(e)=>setAmount(e.target.value)} />
        <Button onClick={pay}>Pay Securely</Button>
        <div className="text-xs text-gray-500">Cards handled via PSP secure iframe; Pulse never sees card data.</div>
      </div>
    </Card>
  )
}
