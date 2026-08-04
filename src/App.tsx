import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'
import ConfigNotice from './components/ConfigNotice'
import Layout from './components/Layout'
import { AdminRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DealDetail from './pages/DealDetail'
import AdminDashboard from './pages/AdminDashboard'
import AdminDealEditor from './pages/AdminDealEditor'
import AdminAudience from './pages/AdminAudience'
import ResetPassword from './pages/ResetPassword'

function App() {
  if (!isSupabaseConfigured) return <ConfigNotice />

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<Layout />}>
            {/* Deals are public - no sign-in required to browse. */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/deals/:slug" element={<DealDetail />} />

            {/* Admin screens still require an admin account. */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audience"
              element={
                <AdminRoute>
                  <AdminAudience />
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
