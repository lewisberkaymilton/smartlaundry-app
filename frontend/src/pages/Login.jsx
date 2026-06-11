import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff, Sparkles, Clock3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandMark from '../components/BrandMark';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(29,78,216,0.35),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.28),transparent_42%)]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.16) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-3xl border border-white/10 bg-slate-900/65 backdrop-blur-xl shadow-2xl shadow-black/45"
      >
        <div className="p-7 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <BrandMark size="lg" />
            <div>
              <p className="text-2xl font-extrabold tracking-tight">
                Smart<span className="text-cyan-300">Laundry</span>
              </p>
              <p className="text-slate-300 text-sm">Campus Laundry Control Center</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-200">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-cyan-300" />
              <span>Real-time machine availability</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-300" />
              <span>Washer and dryer optimized workflows</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan-300" />
              <span>JWT-protected authentication</span>
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-8 lg:p-10 bg-white text-slate-900">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-2">Account Access</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to continue managing your laundry sessions.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary auth-btn mt-2">
              <LogIn size={16} />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            No account yet?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
