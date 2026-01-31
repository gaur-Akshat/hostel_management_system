import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth } from './api';
import { DASHBOARD_ROLES, ROLES } from './utils/roles';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    auth
      .me()
      .then((u) => {
        setUser(u);
        const role = (u.role || '').toString().toLowerCase();
        if (allowedRoles && !allowedRoles.includes(role)) {
          navigate('/login', { replace: true });
        }
      })
      .catch(() => {
        setUser(null);
        navigate('/login', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }
  if (!user) return null;
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
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/student" element={<Navigate to="/dashboard" replace />} />
      <Route path="/guardian" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
