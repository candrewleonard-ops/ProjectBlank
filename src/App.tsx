import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'
import ConfigNotice from './components/ConfigNotice'
import Layout from './components/Layout'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DealDetail from './pages/DealDetail'
import AdminDashboard from './pages/AdminDashboard'
import AdminDealEditor from './pages/AdminDealEditor'

function App() {
  if (!isSupabaseConfigured) return <ConfigNotice />

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deals/:slug"
              element={
                <ProtectedRoute>
                  <DealDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/deals/new"
              element={
                <AdminRoute>
                  <AdminDealEditor />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/deals/:slug"
              element={
                <AdminRoute>
                  <AdminDealEditor />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
