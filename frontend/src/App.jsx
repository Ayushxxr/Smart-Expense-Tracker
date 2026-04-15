import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Budgets from './pages/Budgets'
import Chat from './pages/Chat'
import Insights from './pages/Insights'
import OCRScanner from './pages/OCRScanner'
import Profile from './pages/Profile'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

function ProtectedLayout({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
      <MobileNav />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a30', color: '#f0f0ff', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10 },
            duration: 3000,
          }}
        />
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/expenses"  element={<ProtectedLayout><Expenses /></ProtectedLayout>} />
          <Route path="/budgets"   element={<ProtectedLayout><Budgets /></ProtectedLayout>} />
          <Route path="/chat"      element={<ProtectedLayout><Chat /></ProtectedLayout>} />
          <Route path="/insights"  element={<ProtectedLayout><Insights /></ProtectedLayout>} />
          <Route path="/scanner"   element={<ProtectedLayout><OCRScanner /></ProtectedLayout>} />
          <Route path="/profile"   element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
