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
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden">
      {/* Background: blurry and dull */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed scale-105"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069')" }}
      />
      <div className="absolute inset-0 backdrop-blur-md bg-slate-900/80" aria-hidden="true" />
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight drop-shadow-lg [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
              Hostel Management System
            </h1>
            <p className="text-lg text-slate-100 mt-1.5 drop-shadow-md [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
              Academic DBMS Project
            </p>
          </div>
          {apiStatus && (
            <span
              className={`text-base px-4 py-2 rounded-lg font-medium ${
                apiStatus === 'connected'
                  ? 'bg-emerald-500/40 text-emerald-50 border border-emerald-400/50'
                  : apiStatus === 'disconnected'
                    ? 'bg-red-500/40 text-red-50 border border-red-400/50'
                    : 'bg-white/15 text-slate-200 border border-white/25'
              }`}
            >
              Backend: {apiStatus === 'connected' ? '✓' : apiStatus === 'disconnected' ? '✗' : '?'}
            </span>
          )}
        </div>
      </header>
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="text-center max-w-2xl w-full bg-slate-900/50 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-12">
          <h2 className="text-5xl font-bold text-white mb-6 tracking-tight drop-shadow-lg [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
            Welcome
          </h2>
          <p className="text-xl text-slate-100 mb-12 leading-relaxed drop-shadow-md [text-shadow:0_1px_6px_rgba(0,0,0,0.5)] max-w-lg mx-auto">
            Sign up to create an account, or log in with your role (Admin, Student, or Guardian)
            to access your dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-10 py-4 text-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg shadow-lg transition-colors"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-10 py-4 text-xl bg-white/20 border-2 border-white/40 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
