import { useState, useEffect } from 'react';
import { student as studentApi } from '../api';
import { ROLES } from '../utils/roles';

/**
 * Shared dashboard for Student and Guardian (Parent).
 * Used at /dashboard for both roles; role prop controls read-only message for Guardian.
 * StudentDashboard.jsx and GuardianDashboard.jsx are unused—this single component serves both.
 */
export default function Dashboard({ role }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi
      .me()
      .then(setData)
      .catch((err) => setError(err.error || 'Failed to load your data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-300">Loading your profile...</p>;
  }
  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/20 border border-red-400/50 text-red-100">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const { student, room, fees, attendance, readOnly } = data;
  const s = student || {};
  const isGuardian = (role || '').toString().toLowerCase() === ROLES.GUARDIAN;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Dashboard</h2>
      <p className="text-slate-300 text-sm mb-6">Your profile, room, fees, and attendance.</p>
      {(readOnly || isGuardian) && (
        <p className="text-sm text-slate-400 mb-6">Read-only access. You can only view data.</p>
      )}

      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-3">Profile</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <dt className="text-slate-400">Student ID</dt>
          <dd className="text-white">{s.student_id ?? s.id ?? '-'}</dd>
          <dt className="text-slate-400">Name</dt>
          <dd className="text-white">{s.name ?? s.student_name ?? '-'}</dd>
          <dt className="text-slate-400">Guardian</dt>
          <dd className="text-slate-200">{s.guardian_name ?? '-'}</dd>
          <dt className="text-slate-400">Guardian Phone</dt>
          <dd className="text-slate-200">{s.guardian_phone ?? '-'}</dd>
        </dl>
      </section>

      {room && (
        <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 mb-6">
          <h3 className="font-semibold text-white mb-3">Room</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-400">Room ID</dt>
            <dd className="text-white">{room.room_id ?? room.id ?? '-'}</dd>
            <dt className="text-slate-400">Room No</dt>
            <dd className="text-white">{room.room_no ?? room.room_number ?? '-'}</dd>
          </dl>
        </section>
      )}

      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 mb-6">
        <h3 className="font-semibold text-white mb-3">Fees (recent)</h3>
        {!fees || fees.length === 0 ? (
          <p className="text-slate-400 text-sm">No fee records.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {fees.slice(0, 10).map((f, i) => (
              <li key={f.fee_id ?? f.id ?? i} className="flex justify-between text-slate-200">
                <span>Fee #{f.fee_id ?? f.id}</span>
                <span>{f.amount != null ? `₹${f.amount}` : '-'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6">
        <h3 className="font-semibold text-white mb-3">Attendance (recent)</h3>
        {!attendance || attendance.length === 0 ? (
          <p className="text-slate-400 text-sm">No attendance records.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {attendance.slice(0, 10).map((a, i) => (
              <li key={i} className="flex justify-between text-slate-200">
                <span>{a.date ?? '-'}</span>
                <span>{a.status ?? a.present ?? '-'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
