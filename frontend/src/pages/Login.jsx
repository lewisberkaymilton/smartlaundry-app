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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-blue-100 flex items-center justify-center px-4 py-8">
      {/* Background texture: soft grid + light blobs */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.15) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      />
      <div className="absolute -top-28 -left-16 w-80 h-80 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-10 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur shadow-2xl shadow-slate-300/60"
      >
        {/* Brand side */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-700 to-blue-500 p-8 text-white">
          <div>
            <BrandMark size="lg" className="mb-4" />
            <h1 className="text-3xl font-extrabold tracking-tight">
              Smart<span className="text-blue-100">Laundry</span>
            </h1>
            <p className="mt-2 text-blue-100/90">
              Smarter laundry scheduling for campus life.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock3 size={16} />
              <span>Live machine availability</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <span>Washer & dryer optimized flows</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>Secure JWT-authenticated access</span>
            </div>
          </div>
        </div>

        {/* Form side */}
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="text-center lg:text-left mb-7">
            <BrandMark size="md" className="mb-4 lg:hidden mx-auto lg:mx-0" />
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your SmartLaundry account</p>
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

            <button type="submit" disabled={loading} className="btn-primary mt-2">
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
