import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registration as registrationApi } from '../api';

const ROOM_OPTIONS = [
  { id: '1', label: '1-Seater', price: 170000, period: 'year' },
  { id: '2', label: '2-Seater', price: 150000, period: 'year' },
  { id: '3', label: '3-Seater', price: 130000, period: 'year' },
];

export default function Register() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiReachable, setApiReachable] = useState(null);

  useEffect(() => {
    registrationApi
      .ping()
      .then(() => setApiReachable(true))
      .catch(() => setApiReachable(false));
  }, []);

  const selectedOption = selected ? ROOM_OPTIONS.find((o) => o.id === selected) : null;

  const handlePayAndBook = async () => {
    if (!selected || !selectedOption) return;
    setError('');
    setLoading(true);
    try {
      await registrationApi.payAndBook({
        roomType: selectedOption.label,
        amount: selectedOption.price,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.error || err?.message || 'Failed to pay and book room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Register / Book Room
          </h1>
          <p className="text-slate-300 text-sm">
            Select room type and pay to book. Payment is simulated; you will be redirected to your dashboard.
          </p>
        </div>

        {apiReachable === false && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-amber-500/20 border border-amber-400/50 text-amber-100">
            API not reachable. From <code className="bg-white/10 px-1 rounded">DBMS_Software/backend</code> run <code className="bg-white/10 px-1 rounded">node server.js</code>. Backend must be on port 5000.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/20 border border-red-400/50 text-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-4">
          {ROOM_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                selected === opt.id
                  ? 'bg-white/20 border-white/40 ring-2 ring-white/30'
                  : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{opt.label}</span>
                <span className="text-slate-200 font-medium">
                  ₹{opt.price.toLocaleString()}/{opt.period}
                </span>
              </div>
            </button>
          ))}
        </div>

        {selectedOption && (
          <p className="text-slate-200 text-sm mb-6 px-1">
            {selectedOption.label} — ₹{selectedOption.price.toLocaleString()}/{selectedOption.period}. Click below to pay (simulated) and book.
          </p>
        )}

        <button
          type="button"
          onClick={handlePayAndBook}
          disabled={!selected || loading}
          className="w-full py-3 rounded-lg font-semibold text-white border transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:bg-emerald-500/50 enabled:hover:bg-emerald-500/70 enabled:border-emerald-400/50 disabled:border-white/20 disabled:bg-white/10"
        >
          {loading ? 'Processing...' : 'Pay & Book Room'}
        </button>
      </div>
    </div>
  );
}
