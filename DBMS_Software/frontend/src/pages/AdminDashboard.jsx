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
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Admin Dashboard</h2>
      <p className="text-slate-600 mb-6">Full access: view and manage students and hostel data.</p>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="px-4 py-3 border-b border-slate-200 font-medium text-slate-800">
          Students
        </h3>
        {loading && (
          <p className="p-4 text-slate-500 text-sm">Loading...</p>
        )}
        {error && (
          <p className="p-4 text-red-600 text-sm">{error}</p>
        )}
        {!loading && !error && students.length === 0 && (
          <p className="p-4 text-slate-500 text-sm">No students in database.</p>
        )}
        {!loading && !error && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">ID</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Guardian</th>
                  <th className="px-4 py-2 font-medium">Guardian Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.student_id || s.id}>
                    <td className="px-4 py-2">{s.student_id ?? s.id}</td>
                    <td className="px-4 py-2">{s.name ?? s.student_name ?? '-'}</td>
                    <td className="px-4 py-2">{s.guardian_name ?? '-'}</td>
                    <td className="px-4 py-2">{s.guardian_phone ?? '-'}</td>
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
