import { useState, useEffect } from 'react';
import { student as studentApi } from '../api';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi
      .list()
      .then((data) => setStudents(data.students || []))
      .catch((err) => setError(err.error || 'Failed to load students.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Admin Dashboard</h2>
        <p className="text-slate-300 text-sm">
          Full access: view and manage students and hostel data.
        </p>
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
          <p className="p-6 text-slate-400 text-sm">No students in database.</p>
        )}
        {!loading && !error && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Guardian</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Guardian Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {students.map((s) => (
                  <tr key={s.student_id || s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 text-white font-medium">{s.student_id ?? s.id}</td>
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
