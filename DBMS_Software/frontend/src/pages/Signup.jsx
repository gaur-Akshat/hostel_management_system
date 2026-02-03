import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { useAuth } from '../context/AuthContext';

// Signup collects all required student fields. One password for Student/Guardian login (Guardian uses same Student ID).
export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    course: '',
    year: '',
    guardian_name: '',
    guardian_phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pwd = formData.password;
    let score = 0;
    if (!pwd) {
      setStrength(0);
      return;
    }
    if (pwd.length > 5) score += 1;
    if (pwd.length > 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    setStrength(score);
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await auth.signup({
        name: formData.name.trim(),
        gender: formData.gender.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim(),
        address: formData.address.trim() || undefined,
        course: formData.course.trim() || undefined,
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        guardian_name: formData.guardian_name.trim() || undefined,
        guardian_phone: formData.guardian_phone.trim() || undefined,
        password: formData.password,
      });
      setUser(data.user);
      if (data.user?.studentCode) {
        alert(`Account created. Your Student ID is ${data.user.studentCode}. Use it with your password to log in (Guardian uses the same ID).`);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.error || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-600';
    if (strength < 2) return 'bg-red-500';
    if (strength < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength < 2) return 'Weak';
    if (strength < 4) return 'Medium';
    return 'Strong';
  };

  const inputClass = 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all';
  const labelClass = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2';

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2069')] bg-cover bg-center bg-fixed flex items-center justify-center px-4 font-sans relative">
      <div className="absolute inset-0 bg-slate-900/60" />

      <div className="relative z-10 w-full max-w-lg bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-slate-300 text-sm">Register as Student. Use your Student ID and password to log in (Guardian uses same ID).</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm bg-red-500/20 border border-red-400/50 text-red-100 text-center">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Full Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="Enter your name" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                <option value="" className="text-slate-900">Select</option>
                <option value="Male" className="text-slate-900">Male</option>
                <option value="Female" className="text-slate-900">Female</option>
                <option value="Other" className="text-slate-900">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="e.g. 9876543210" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="Enter your email" />
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="Full address" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Course</label>
              <input type="text" name="course" value={formData.course} onChange={handleChange} className={inputClass} placeholder="e.g. B.Tech CSE" />
            </div>
            <div>
              <label className={labelClass}>Year</label>
              <input type="number" name="year" value={formData.year} onChange={handleChange} min={1} max={4} className={inputClass} placeholder="1-4" />
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 mt-4">
            <p className="text-slate-300 text-xs font-medium uppercase tracking-wider mb-3">Guardian Details</p>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Guardian Name</label>
                <input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleChange} className={inputClass} placeholder="Guardian full name" />
              </div>
              <div>
                <label className={labelClass}>Guardian Phone</label>
                <input type="text" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} className={inputClass} placeholder="e.g. 9876543210" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Password * (for Student & Guardian login)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            <div className="mt-2">
              <div className="h-1 w-full bg-slate-600 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ease-out ${getStrengthColor()}`} style={{ width: `${(strength / 4) * 100}%` }} />
              </div>
              <p className={`text-xs mt-1 text-right font-medium ${strength < 2 ? 'text-red-400' : strength < 4 ? 'text-amber-400' : 'text-emerald-400'}`}>{getStrengthLabel()}</p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`${inputClass} pr-10`}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none">
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transition-colors">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center pt-6 border-t border-white/20">
          <p className="text-sm text-slate-300">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-medium hover:underline transition-colors">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
