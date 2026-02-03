import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { student as studentApi } from '../api';

const ROLES = { ADMIN: 'admin', STUDENT: 'student', GUARDIAN: 'guardian' };

/**
 * Shared dashboard for Student and Guardian.
 * Shows logged-in user's real profile, fees, room, and attendance.
 */
export default function Dashboard({ role = 'student' }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi
      .me()
      .then((res) => {
        setData(res);
        setError('');
      })
      .catch((err) => {
        setData(null);
        setError(err?.error || err?.message || 'Failed to load dashboard.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-4 w-32 bg-white/30 rounded mb-2" />
          <p className="text-slate-300 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const noStudentRecord =
    error &&
    (error.toLowerCase().includes('no student record') ||
     error.toLowerCase().includes('no student linked'));

  if (error && !noStudentRecord) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 text-red-200 px-4 py-3 rounded-xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  // No student record: show welcome + Pay fees & Register to room (glassmorphism)
  if (noStudentRecord) {
    const displayName = user?.name ?? user?.email ?? 'Student';
    return (
      <div className="space-y-6">
        <header className="border-b border-white/20 pb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Dashboard</h1>
          <p className="text-slate-300 text-sm mt-1">
            Welcome, <span className="font-semibold text-white">{displayName}</span>
          </p>
        </header>
        <div className="bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-100 px-4 py-3 rounded-xl flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6">
          <h3 className="font-semibold text-white mb-2">What you can do</h3>
          <p className="text-slate-200 text-sm mb-4">
            You have not booked a room yet. Go to Register / Book Room to select a room type and click Pay & Book Room (payment is simulated). This creates your student profile and assigns your room.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium rounded-lg transition-colors"
            >
              Register / Book Room
            </Link>
          </div>
          <p className="text-slate-300 text-sm mt-5 pt-4 border-t border-white/10">
            Need help? <a href="tel:8218748251" className="font-semibold text-white hover:underline">Call 8218748251</a>
          </p>
        </section>
      </div>
    );
  }

  if (!data) return null;

  const { student, room, roommates = [], fees, attendance, readOnly } = data;
  const s = student || {};
  const displayName = s.name ?? s.student_name ?? user?.name ?? user?.email ?? 'Student';
  const isGuardian = (role || '').toString().toLowerCase() === ROLES.GUARDIAN;
  const occupied = room?.occupied ?? 0;
  const capacity = room?.capacity ?? (room ? 1 : 0);
  const occupancyText = capacity > 0 ? `${occupied}/${capacity} occupied` : null;

  // Normalize fee status (backend may use status or payment_status, PAID/PENDING or paid/pending)
  const getFeeStatusValue = (f) => (f?.status || f?.payment_status || 'PENDING').toString();
  const getFeeStatusKey = (f) => getFeeStatusValue(f).toLowerCase();
  const hasPendingFees = Array.isArray(fees) && fees.some((f) => getFeeStatusKey(f) === 'pending');
  const hasNoRoom = !room || (!room.room_no && !room.room_number);
  const showPayAndRegister = (hasPendingFees || hasNoRoom) && !readOnly;

  const StatusBadge = ({ status }) => {
    const st = String(status || '').toLowerCase();
    let color = 'bg-white/10 text-slate-200 border-white/20';
    if (st === 'paid' || st === 'present') color = 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40';
    if (st === 'pending' || st === 'absent') color = 'bg-amber-500/30 text-amber-200 border-amber-400/40';
    if (st === 'overdue') color = 'bg-red-500/30 text-red-200 border-red-400/40';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${color} capitalize`}>
        {status || '-'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/20 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Dashboard</h1>
          <p className="text-slate-300 text-sm mt-1">
            Welcome back, <span className="font-semibold text-white">{displayName}</span>
          </p>
        </div>
        {(readOnly || isGuardian) && (
          <div className="bg-white/10 backdrop-blur-md text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-white/20 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            View-Only Mode
          </div>
        )}
      </header>

      {/* Pay fees & Register to room (student only, when unpaid or no room) */}
      {showPayAndRegister && (
        <section className="bg-amber-500/20 backdrop-blur-md border border-amber-400/30 rounded-xl p-6">
          <h3 className="font-semibold text-amber-100 mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Action required
          </h3>
          <p className="text-amber-100/90 text-sm mb-4">
            {hasNoRoom && 'Book a room: go to Register / Book Room, select a room type, and click Pay & Book Room (payment is simulated).'}
            {!hasNoRoom && hasPendingFees && 'You have pending fee(s). Pay them from Register / Book Room.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium rounded-lg transition-colors"
            >
              Register / Book Room
            </Link>
          </div>
        </section>
      )}

      {/* Top Grid: Profile & Room */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-5 border-b border-white/20 pb-4">
            <div className="p-2 bg-white/10 rounded-lg text-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">Personal Information</h3>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Student ID</dt>
              <dd className="text-sm font-semibold text-white">{s.student_id ?? s.id ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Name</dt>
              <dd className="text-sm font-semibold text-white">{s.name ?? s.student_name ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Guardian Name</dt>
              <dd className="text-sm text-slate-200">{s.guardian_name ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Guardian Contact</dt>
              <dd className="text-sm text-slate-200 font-mono">{s.guardian_phone ?? '-'}</dd>
            </div>
          </dl>
        </section>

        {/* Room Status Card */}
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-lg text-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">Room Status</h3>
          </div>
          {room ? (
            <div className="space-y-3">
              <div className="text-center py-3 bg-white/10 rounded-lg border border-white/20">
                <p className="text-xs text-slate-400 uppercase font-medium mb-1">Room Number</p>
                <p className="text-2xl font-bold text-white tracking-tight">{room.room_no ?? room.room_number ?? '-'}</p>
              </div>
              {room.room_type && (
                <p className="text-sm text-slate-200">
                  <span className="text-slate-400">Room type:</span> <span className="font-medium text-white">{room.room_type}</span>
                </p>
              )}
              {occupancyText && (
                <p className="text-sm text-slate-200">
                  <span className="text-slate-400">Occupancy:</span> <span className="font-medium text-white">{occupancyText}</span>
                </p>
              )}
              {roommates.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-slate-400 uppercase font-medium mb-1">Roommates</p>
                  <ul className="text-sm text-slate-200 space-y-0.5">
                    {roommates.map((m) => (
                      <li key={m.student_id}>{m.name ?? `Student #${m.student_id}`}</li>
                    ))}
                  </ul>
                </div>
              )}
              {fees && fees.length > 0 && (
                <p className="text-sm text-slate-200">
                  <span className="text-slate-400">Fee status:</span>{' '}
                  <StatusBadge status={getFeeStatusValue(fees[0])} />
                </p>
              )}
              <p className="text-xs text-slate-400">ID: {room.room_id ?? room.id}</p>
            </div>
          ) : (
            <div className="text-center py-6 bg-white/5 rounded-lg border border-dashed border-white/20">
              <p className="text-slate-400 text-sm">No room allocated yet.</p>
              <p className="text-slate-500 text-xs mt-1">Go to Register / Book Room to pay and book.</p>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Grid: Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fees Table */}
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center bg-white/5">
            <h3 className="font-semibold text-white">Recent Fee Records</h3>
            <span className="text-xs font-medium px-2 py-1 bg-white/10 text-slate-300 rounded">Last 5</span>
          </div>
          <div className="overflow-x-auto">
            {!fees || fees.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No fee records found.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400 font-medium border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 w-20">ID</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {fees.slice(0, 5).map((f, i) => (
                    <tr key={f.fee_id ?? f.id ?? i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3.5 text-slate-400">#{f.fee_id ?? f.id ?? '-'}</td>
                      <td className="px-6 py-3.5 font-medium text-white">
                        {f.amount != null ? `₹${Number(f.amount).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <StatusBadge status={getFeeStatusValue(f)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Attendance Table */}
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center bg-white/5">
            <h3 className="font-semibold text-white">Attendance Log</h3>
            <span className="text-xs font-medium px-2 py-1 bg-white/10 text-slate-300 rounded">Recent</span>
          </div>
          <div className="overflow-x-auto">
            {!attendance || attendance.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No attendance records found.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400 font-medium border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {attendance.slice(0, 5).map((a, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3.5 text-slate-200">
                        {a.date ? new Date(a.date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <StatusBadge status={a.status ?? a.present} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
