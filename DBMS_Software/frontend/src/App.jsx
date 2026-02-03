import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DASHBOARD_ROLES, ROLES } from './utils/roles';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import RegistrationSummary from './pages/RegistrationSummary';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069')] bg-cover bg-center bg-fixed flex items-center justify-center relative">
        <div className="absolute inset-0 bg-slate-900/60" />
        <p className="relative z-10 text-white font-medium">Loading...</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const role = (user.role || '').toString().toLowerCase();
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return typeof children === 'function' ? children(user) : children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            {(user) => (
              <Layout role={user?.role ?? ROLES.ADMIN}>
                <AdminDashboard />
              </Layout>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={DASHBOARD_ROLES}>
            {(user) => (
              <Layout role={user.role}>
                <Dashboard role={user.role} />
              </Layout>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/register"
        element={
          <ProtectedRoute allowedRoles={DASHBOARD_ROLES}>
            {(user) => (
              <Layout role={user.role}>
                <Register />
              </Layout>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/registration-summary"
        element={
          <ProtectedRoute allowedRoles={DASHBOARD_ROLES}>
            {(user) => (
              <Layout role={user.role}>
                <RegistrationSummary />
              </Layout>
            )}
          </ProtectedRoute>
        }
      />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/student" element={<Navigate to="/dashboard" replace />} />
      <Route path="/guardian" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
