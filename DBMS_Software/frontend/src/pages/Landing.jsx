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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Hostel Management System</h1>
            <p className="text-sm text-slate-600 mt-1">Academic DBMS Project</p>
          </div>
          {apiStatus && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                apiStatus === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : apiStatus === 'disconnected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              Backend: {apiStatus === 'connected' ? '✓' : apiStatus === 'disconnected' ? '✗' : '?'}
            </span>
          )}
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Welcome</h2>
          <p className="text-slate-600 mb-8">
            Sign up to create an account, or log in with your role (Admin, Student, or Guardian)
            to access your dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
            >
              Log In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
