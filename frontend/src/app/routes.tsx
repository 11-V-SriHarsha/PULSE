import { lazy, useEffect } from 'react'
import { RouteObject, useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import AuthLayout from '../features/auth/AuthLayout'

const LoginPage = lazy(() => import('../features/auth/LoginPage'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'))
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'))
const TransactionsPage = lazy(() => import('../features/transactions/TransactionsPage'))
const ImportHubPage = lazy(() => import('../features/import/ImportHubPage'))
const MakePaymentPage = lazy(() => import('../features/payments/MakePaymentPage'))
const PaymentHistoryPage = lazy(() => import('../features/payments/PaymentHistoryPage'))
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'))
const AAConsentPage = lazy(() => import('../features/aa/AAConsentPage'))

// Component that uses useNavigate hook for redirection
const RedirectToDashboard = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/dashboard', { replace: true })
  }, [navigate])

  return null
}

const routes: RouteObject[] = [
  { path: '/', element: <RedirectToDashboard /> },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> }
    ]
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'import', element: <ImportHubPage /> },
      { path: 'payments/make', element: <MakePaymentPage /> },
      { path: 'payments/history', element: <PaymentHistoryPage /> },
      { path: 'aa/consent', element: <AAConsentPage /> },
      { path: 'profile', element: <ProfilePage /> }
    ]
  },
  { path: '*', element: <RedirectToDashboard /> }
]

export default routes
