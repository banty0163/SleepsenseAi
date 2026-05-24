import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AssessmentPage from './pages/AssessmentPage'
import ResultPage from './pages/ResultPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import BMIPage from './pages/BMIPage'
import LoadingSpinner from './components/LoadingSpinner'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner fullscreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner fullscreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public */}
            <Route index element={<HomePage />} />
            <Route path="login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            {/* Protected */}
            <Route path="dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="assessment" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
            <Route path="result/:id" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
            <Route path="history"    element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="bmi"        element={<ProtectedRoute><BMIPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
