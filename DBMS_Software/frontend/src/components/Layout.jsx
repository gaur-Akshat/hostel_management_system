import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { isAdmin } from '../utils/roles';

export default function Layout({ children, role }) {
  const navigate = useNavigate();
  const r = (role || '').toString().toLowerCase();

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/');
    } catch (e) {
      navigate('/');
    }
  };

  const dashLabel = isAdmin(r) ? 'Admin Dashboard' : 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">Hostel Management</h1>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-slate-600 capitalize">{dashLabel}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
