import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export const ProtectedRoute = (): React.JSX.Element | null => {
  const { unlocked, loading } = useAuth()
  if (loading) return null
  return unlocked ? <Outlet /> : <Navigate to="/auth" replace />
}
