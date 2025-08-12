import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import routes from './app/routes'
import ConnectionStatus from './components/ConnectionStatus'

export default function App() {
  const element = useRoutes(routes)
  return (
    <>
      <ConnectionStatus />
      <Suspense fallback={<div className="p-8">Loading…</div>}>
        {element}
      </Suspense>
    </>
  )
}
