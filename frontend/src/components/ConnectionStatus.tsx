import { useState, useEffect } from 'react'
import apiClient from '../lib/apiClient'

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiClient.get('/api/health')
        setIsConnected(true)
      } catch (error) {
        setIsConnected(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (isConnected === null) return null

  if (!isConnected) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        <strong>Backend Disconnected:</strong> Please start the backend server on port 5000
      </div>
    )
  }

  return null
}