import { useState, useEffect } from 'react';
import { student as studentApi, seed as seedApi } from '../api';

// ER: 8 tables only. No registration_requests. Admin views STUDENT list; demo data seeds STUDENT + USERS + ROOM.
export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);

  const loadStudents = () => {
    studentApi
      .list()
      .then((data) => setStudents(data.students || []))
      .catch((err) => setError(err.error || 'Failed to load students.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleLoadDemoData = async () => {
    setSeedLoading(true);
    try {
      const data = await seedApi.loadDemo();
      loadStudents();
      alert(data?.message || 'Demo data loaded.');
    } catch (err) {
      const msg = err?.status === 404
        ? 'Seed API not found. Make sure the backend is running (node server.js).'
        : (err?.error || 'Failed to load demo data.');
      alert(msg);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Admin Dashboard</h2>
          <p className="text-slate-300 text-sm">
            View students. Room booking uses FEES + ROOM_ALLOCATION + STUDENT (no approval step).
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadDemoData}
          disabled={seedLoading}
          className="px-4 py-2 rounded-lg bg-emerald-500/40 hover:bg-emerald-500/60 text-white font-medium border border-emerald-400/50 disabled:opacity-50 shrink-0"
        >
          {seedLoading ? 'Loading...' : 'Load demo data (for evaluation)'}
        </button>
      </div>

      <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl overflow-hidden">
        <h3 className="px-6 py-4 border-b border-white/20 font-semibold text-white">
          Students
        </h3>
        {loading && (
          <p className="p-6 text-slate-300 text-sm">Loading...</p>
        )}
        {error && (
          <p className="p-6 text-red-200 text-sm bg-red-500/20 border-b border-white/10">{error}</p>
        )}
        {!loading && !error && students.length === 0 && (
          <p className="p-6 text-slate-400 text-sm">No students in database. Use &quot;Load demo data&quot; or have students sign up.</p>
        )}
        {!loading && !error && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Guardian</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Guardian Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {students.map((s) => (
                  <tr key={s.student_id || s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 text-white font-medium">{s.student_id ?? s.id}</td>
                    <td className="px-6 py-3 text-slate-200 font-mono">{s.student_code ?? '-'}</td>
                    <td className="px-6 py-3 text-white">{s.name ?? s.student_name ?? '-'}</td>
                    <td className="px-6 py-3 text-slate-200">{s.guardian_name ?? '-'}</td>
                    <td className="px-6 py-3 text-slate-200">{s.guardian_phone ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
