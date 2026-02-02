import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { health } from '../api';

export default function Landing() {
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    health()
      .then((data) => {
        console.log('GET /api/health response:', data);
        setApiStatus(data.ok ? 'connected' : 'unknown');
      })
      .catch((err) => {
        console.warn('API health check failed:', err);
        setApiStatus('disconnected');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069')] bg-cover bg-center bg-fixed flex flex-col font-sans relative">
      <div className="absolute inset-0 bg-slate-900/60" />
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Hostel Management System</h1>
            <p className="text-sm text-slate-300 mt-1">Academic DBMS Project</p>
          </div>
          {apiStatus && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                apiStatus === 'connected'
                  ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/50'
                  : apiStatus === 'disconnected'
                    ? 'bg-red-500/30 text-red-100 border border-red-400/50'
                    : 'bg-white/10 text-slate-300 border border-white/20'
              }`}
            >
              Backend: {apiStatus === 'connected' ? '✓' : apiStatus === 'disconnected' ? '✗' : '?'}
            </span>
          )}
        </div>
      </header>
      <main className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome</h2>
          <p className="text-slate-300 mb-8">
            Sign up to create an account, or log in with your role (Admin, Student, or Guardian)
            to access your dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg shadow-lg transition-colors"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
