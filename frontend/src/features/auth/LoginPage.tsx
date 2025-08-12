import { FormEvent, useState } from 'react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import api from '../../lib/apiClient'
import { API } from '../../lib/endpoints'
import { useSetRecoilState } from 'recoil'
import { authState } from '../../state/auth.atom'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string>()
  const setAuth = useSetRecoilState(authState)
  const navigate = useNavigate()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(undefined)
    try {
      const r = await api.post(API.LOGIN, { email, password })
      setAuth({ isAuthed: true, user: r.data })
      navigate('/dashboard')
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-semibold mb-2 text-center text-gray-900 dark:text-white">Sign in</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">Welcome back to <span className="font-medium text-gray-900 dark:text-white">Pulse</span>.</p>

      <div className="space-y-4">
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="text-sm text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{err}</div>}
        <Button type="submit" className="w-full py-3 font-medium">Login</Button>
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
          New here?{' '}
          <Link to="/auth/register" className="text-[var(--accent)] hover:underline font-medium">Create an account</Link>
        </div>
      </div>
    </form>
  )
}
