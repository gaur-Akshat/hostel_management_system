import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roles';

export default function Layout({ children, role }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const r = (role || '').toString().toLowerCase();

  const handleLogout = async () => {
    try {
      await auth.logout();
      setUser(null);
      navigate('/');
    } catch (e) {
      setUser(null);
      navigate('/');
    }
  };

  const dashLabel = isAdmin(r) ? 'Admin Dashboard' : 'Dashboard';

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069')] bg-cover bg-center bg-fixed font-sans relative">
      <div className="absolute inset-0 bg-slate-900/60" />
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white tracking-tight">Hostel Management</h1>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-slate-300 font-medium capitalize">{dashLabel}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-300 hover:text-white font-medium transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
