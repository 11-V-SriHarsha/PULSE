import { FormEvent, useState } from 'react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'
import { useNavigate, Link } from 'react-router-dom'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string>()
  const navigate = useNavigate()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(undefined)
    try {
      await api.post(API.REGISTER, { email, name, password })
      await api.post(API.LOGIN, { email, password })
      navigate('/dashboard')
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h1 className="text-2xl font-semibold mb-2 text-center">Create account</h1>
      <p className="text-sm text-gray-600 mb-6 text-center">Join <span className="font-medium">Pulse</span> and take control of your money.</p>

      <div className="space-y-3">
        <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password (min 8 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="text-sm text-red-600 text-center">{err}</div>}
        <Button type="submit" className="w-full">Register</Button>
        <div className="text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
        </div>
      </div>
    </form>
  )
}
